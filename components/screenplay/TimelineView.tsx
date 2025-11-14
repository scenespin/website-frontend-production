"use client"

import { useEffect, useRef, useState } from "react"
import { Timeline } from "vis-timeline/standalone"
import { DataSet } from "vis-data"
import "vis-timeline/styles/vis-timeline-graph2d.css"
import "@/styles/timeline.css"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useScreenplay } from "@/contexts/ScreenplayContext"
import { Scene, StoryBeat, Character, Location } from "@/types/screenplay"

interface TimelineItem {
  id: string
  group: string
  content: string
  title: string
  start: Date
  end: Date
  className: string
  sceneData?: Scene
}

interface TimelineGroup {
  id: string
  content: string
  title?: string
  nestedGroups?: string[]
  className?: string
  visible?: boolean
}

interface TimelineViewProps {
  focusSceneId?: string;
}

export default function TimelineView({ focusSceneId }: TimelineViewProps = {}) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const screenplay = useScreenplay()
  
  // Control states
  const [showMajorLabel, setShowMajorLabel] = useState(true)
  const [showMinorLabel, setShowMinorLabel] = useState(true)
  const [isDraggable, setIsDraggable] = useState(true)
  const [allowZoom, setAllowZoom] = useState(true)
  const [showCharacters, setShowCharacters] = useState(true)
  const [showLocations, setShowLocations] = useState(true)

  useEffect(() => {
    if (!timelineRef.current) return

    // Build groups from story beats (acts)
    const groups = new DataSet<TimelineGroup>()
    const items = new DataSet<TimelineItem>()

    // Get screenplay data
    const beats = screenplay.beats
    const characters = screenplay.characters
    const locations = screenplay.locations
    
    // Get all scenes from all beats
    const scenes: Scene[] = []
    beats.forEach(beat => {
      scenes.push(...beat.scenes)
    })

    // If no data, show empty state
    if (beats.length === 0 && scenes.length === 0) {
      // Create a single group for ungrouped scenes
      groups.add({
        id: 'ungrouped',
        content: 'Ungrouped Scenes',
        className: 'group-header'
      })
    } else {
      // Feature 0117: Group scenes by group_label (optional) or by beat.scenes array
      beats.forEach((beat) => {
        // Scenes are already grouped in beat.scenes array (frontend-only grouping)
        const beatScenes = beat.scenes || []
        const sceneIds = beatScenes.map(s => s.id)
        
        groups.add({
          id: beat.id,
          content: beat.title,
          title: beat.description,
          className: 'group-header',
          nestedGroups: sceneIds.length > 0 ? sceneIds : undefined
        })

        // Add each scene as a sub-group
        beatScenes.forEach((scene) => {
          groups.add({
            id: scene.id,
            content: `Scene ${scene.number}`,
            title: scene.heading,
            className: 'sub-group'
          })
        })
      })

      // Feature 0117: No need to handle ungrouped - all scenes are in beats.scenes array
      // (Frontend grouping ensures all scenes are assigned to a beat)
    }

    // Create timeline items for each scene
    // Use hours/minutes/seconds instead of days for more granular timeline
    const baseDate = new Date(2025, 0, 1, 0, 0, 0) // Start at midnight
    const minutesBetweenScenes = 5 // 5 minutes between scenes (default spacing)
    const defaultSceneDuration = 3 // Default scene duration in minutes

    scenes.forEach((scene, index) => {
      // Use scene's timing data if available, otherwise calculate from index
      const startDate = new Date(baseDate)
      if (scene.timing?.startMinute !== undefined) {
        startDate.setMinutes(startDate.getMinutes() + scene.timing.startMinute)
      } else {
        // Fallback: calculate from scene order
        startDate.setMinutes(startDate.getMinutes() + (index * minutesBetweenScenes))
      }
      
      const endDate = new Date(startDate)
      const duration = scene.timing?.durationMinutes ?? defaultSceneDuration
      endDate.setMinutes(endDate.getMinutes() + duration)

      // Get characters and location for this scene (with defensive null checks)
      const sceneCharacters = (scene.fountain?.tags?.characters || [])
        .map(charId => characters.find(c => c.id === charId))
        .filter(Boolean) as Character[]
      
      const sceneLocation = scene.fountain?.tags?.location
        ? locations.find(l => l.id === scene.fountain.tags.location)
        : null

      // Build content HTML
      const characterNames = showCharacters && sceneCharacters.length > 0
        ? `<div class="item-characters">👥 ${sceneCharacters.map(c => c.name).join(', ')}</div>`
        : ''
      
      const locationName = showLocations && sceneLocation
        ? `<div class="item-location">📍 ${sceneLocation.name}</div>`
        : ''

      const statusClass = scene.status === 'final' ? 'final' : scene.status === 'review' ? 'review' : 'draft'

      const content = `<div class="item-content">
        <span class="item-title">${scene.heading}</span>
        <span class="item-synopsis">${scene.synopsis || 'No synopsis'}</span>
        ${characterNames}
        ${locationName}
        <span class="item-status ${statusClass}">${scene.status.toUpperCase()}</span>
      </div>`

      const title = `${scene.heading}\n${scene.synopsis || ''}\nStatus: ${scene.status}\nCharacters: ${sceneCharacters.map(c => c.name).join(', ') || 'None'}\nLocation: ${sceneLocation?.name || 'None'}`

      items.add({
        id: scene.id,
        group: scene.id, // Each scene is in its own group
        content,
        title,
        start: startDate,
        end: endDate,
        className: `timeline-item ${statusClass}-status`,
        sceneData: scene
      })
    })

    // Create timeline with options
    const options = {
      zoomable: allowZoom,
      moveable: true,
      selectable: true,
      editable: {
        add: false,
        updateTime: isDraggable,
        updateGroup: false,
        remove: false,
      },
      orientation: "top",
      stack: false,
      margin: {
        item: {
          horizontal: 0,
        },
      },
      showCurrentTime: false,
      showMajorLabels: showMajorLabel,
      showMinorLabels: showMinorLabel,
      tooltip: {
        followMouse: true,
        overflowMethod: "cap",
      },
      groupTemplate: (group: any) => {
        if (!group || group.content === undefined) {
          return ""
        }
        return `<div class="custom-group">${group.content}</div>`
      },
      template: (item: any) => {
        return item.content
      },
      groupOrder: (a: any, b: any) => {
        // Order by group ID (maintains scene order)
        return a.id.localeCompare(b.id)
      },
      horizontalScroll: true,
      verticalScroll: true,
      maxHeight: '800px',
      // Dynamic time axis - vis-timeline will automatically adjust scale
      format: {
        minorLabels: {
          millisecond: 'SSS[ms]',
          second: 'ss',
          minute: 'HH:mm',
          hour: 'HH:mm',
          weekday: 'ddd D',
          day: 'D',
          week: 'w',
          month: 'MMM',
          year: 'YYYY'
        },
        majorLabels: {
          millisecond: 'HH:mm:ss',
          second: 'HH:mm:ss',
          minute: 'HH:mm',
          hour: 'HH[h]',
          weekday: 'MMMM YYYY',
          day: 'MMMM YYYY',
          week: 'MMMM YYYY',
          month: 'YYYY',
          year: ''
        }
      },
      // Let vis-timeline auto-scale based on zoom level
      // It will automatically choose: seconds -> minutes -> 5min -> 10min -> 30min -> hours -> days
      start: baseDate,
      end: new Date(baseDate.getTime() + (scenes.length * minutesBetweenScenes * 60 * 1000) + (30 * 60 * 1000)), // +30 minutes padding
      zoomMin: 1000 * 10, // Minimum zoom: 10 seconds
      zoomMax: 1000 * 60 * 60 * 24 * 30, // Maximum zoom: 30 days
    } as any

    // Initialize timeline
    const newTimeline = new Timeline(timelineRef.current, items, groups, options)
    setTimeline(newTimeline)

    // Add event listeners for group clicking and collapsing
    newTimeline.on("click", (properties) => {
      if (properties.what === "group-label") {
        const clickedGroupId = properties.group
        const groupDataArray = groups.get(clickedGroupId)
        const groupData = Array.isArray(groupDataArray) ? groupDataArray[0] : groupDataArray

        // If the group has nested groups, toggle collapse/expand
        if (groupData && groupData.nestedGroups && groupData.nestedGroups.length > 0) {
          const isCollapsed = !groupData.className?.includes("collapsed")

          if (isCollapsed) {
            // Collapse: hide nested groups
            groupData.nestedGroups.forEach((nestedId: string) => {
              const nestedGroupArray = groups.get(nestedId)
              const nestedGroup = Array.isArray(nestedGroupArray) ? nestedGroupArray[0] : nestedGroupArray
              if (nestedGroup) {
                groups.update({ ...nestedGroup, visible: false })
              }
            })
            groups.update({ ...groupData, className: (groupData.className || '') + " collapsed" })
          } else {
            // Expand: show nested groups
            groupData.nestedGroups.forEach((nestedId: string) => {
              const nestedGroupArray = groups.get(nestedId)
              const nestedGroup = Array.isArray(nestedGroupArray) ? nestedGroupArray[0] : nestedGroupArray
              if (nestedGroup) {
                groups.update({ ...nestedGroup, visible: true })
              }
            })
            groups.update({ ...groupData, className: groupData.className?.replace(" collapsed", "") || '' })
          }
        }

        // Scroll to the first item in this group
        scrollToGroupItems(clickedGroupId)
      }

      // Handle item clicks (scene selection)
      if (properties.what === "item" && properties.item) {
        const itemData = items.get(properties.item as string)
        if (itemData && itemData.sceneData) {
          console.log("Selected scene:", itemData.sceneData)
          // TODO: Open scene detail panel
        }
      }
    })

    // Handle timeline item movement (drag & drop)
    newTimeline.on("itemover", (properties) => {
      if (properties.item && isDraggable) {
        const item = items.get(properties.item as string)
        if (item) {
          // Show draggable cursor
          if (timelineRef.current) {
            timelineRef.current.style.cursor = "move"
          }
        }
      }
    })

    newTimeline.on("itemout", () => {
      if (timelineRef.current) {
        timelineRef.current.style.cursor = "default"
      }
    })

    // Handle item time updates (when user drags/resizes)
    newTimeline.on("changed", () => {
      // Get all current items
      const currentItems = items.get()
      
      currentItems.forEach((item) => {
        if (item.sceneData) {
          const scene = item.sceneData
          
          // Calculate new timing from item's start/end dates
          const startMinute = Math.round((item.start.getTime() - baseDate.getTime()) / (1000 * 60))
          const endMinute = Math.round((item.end.getTime() - baseDate.getTime()) / (1000 * 60))
          const durationMinutes = endMinute - startMinute
          
          // Only update if timing actually changed
          const currentStart = scene.timing?.startMinute ?? 0
          const currentDuration = scene.timing?.durationMinutes ?? defaultSceneDuration
          
          if (startMinute !== currentStart || durationMinutes !== currentDuration) {
            console.log(`[Timeline] Scene "${scene.heading}" timing changed:`, {
              oldStart: currentStart,
              newStart: startMinute,
              oldDuration: currentDuration,
              newDuration: durationMinutes
            })
            
            // Calculate page number (1 page ≈ 1 minute of screen time)
            const pageNumber = Math.max(1, Math.round(startMinute / 1))
            
            // Update scene with new timing data
            const updatedScene: Scene = {
              ...scene,
              timing: {
                startMinute,
                durationMinutes,
                pageNumber
              },
              estimatedPageCount: Math.max(1, Math.round(durationMinutes / 1)),
              updatedAt: new Date().toISOString()
            }
            
            // Persist the change
            screenplay.updateScene(updatedScene.id, updatedScene)
              .then(() => {
                console.log(`[Timeline] Scene timing saved to screenplay data`)
              })
              .catch((error) => {
                console.error(`[Timeline] Failed to save scene timing:`, error)
              })
          }
        }
      })
    })

    // Function to scroll to items in a group
    const scrollToGroupItems = (groupId: string) => {
      const groupItems = items.get({
        filter: (item: TimelineItem) => item.group === groupId,
      })

      if (groupItems.length > 0) {
        // Sort items by start date
        groupItems.sort((a: TimelineItem, b: TimelineItem) => a.start.getTime() - b.start.getTime())

        // Get the earliest start date and latest end date
        const earliestStart = groupItems[0].start
        const latestEnd = groupItems.reduce(
          (latest: Date, item: TimelineItem) => (item.end.getTime() > latest.getTime() ? item.end : latest),
          groupItems[0].end,
        )

        // Add some padding
        const startDate = new Date(earliestStart)
        startDate.setDate(startDate.getDate() - 2)

        const endDate = new Date(latestEnd)
        endDate.setDate(endDate.getDate() + 2)

        // Set the window to show these items
        newTimeline.setWindow(startDate, endDate)
      }
    }

    // Cleanup on unmount
    return () => {
      if (newTimeline) {
        newTimeline.destroy()
      }
    }
  }, [timelineRef, screenplay, showMajorLabel, showMinorLabel, isDraggable, allowZoom, showCharacters, showLocations])

  // Handle focusing on a specific scene
  useEffect(() => {
    if (timeline && focusSceneId) {
      // Focus on the scene in the timeline
      timeline.focus(focusSceneId, { animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
      
      // Select/highlight the item
      timeline.setSelection(focusSceneId);
      
      // Remove selection after 2 seconds
      setTimeout(() => {
        timeline.setSelection([]);
      }, 2000);
    }
  }, [focusSceneId, timeline]);

  const handleZoomIn = () => {
    if (timeline) {
      const currentRange = timeline.getWindow()
      const start = new Date(currentRange.start.valueOf())
      const end = new Date(currentRange.end.valueOf())
      const interval = end.getTime() - start.getTime()
      const newInterval = interval * 0.7
      const center = new Date((start.getTime() + end.getTime()) / 2)
      const newStart = new Date(center.getTime() - newInterval / 2)
      const newEnd = new Date(center.getTime() + newInterval / 2)
      timeline.setWindow(newStart, newEnd)
    }
  }

  const handleZoomOut = () => {
    if (timeline) {
      const currentRange = timeline.getWindow()
      const start = new Date(currentRange.start.valueOf())
      const end = new Date(currentRange.end.valueOf())
      const interval = end.getTime() - start.getTime()
      const newInterval = interval * 1.3
      const center = new Date((start.getTime() + end.getTime()) / 2)
      const newStart = new Date(center.getTime() - newInterval / 2)
      const newEnd = new Date(center.getTime() + newInterval / 2)
      timeline.setWindow(newStart, newEnd)
    }
  }

  const handleFitAll = () => {
    if (timeline) {
      timeline.fit()
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#1C1C1E' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b gap-3" style={{ borderColor: '#2C2C2E' }}>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: '#E5E7EB' }}>
            Screenplay Timeline
          </h2>
          <div className="text-xs sm:text-sm mt-1" style={{ color: '#9CA3AF' }}>
            Timeline auto-scales: seconds → minutes → hours
          </div>
        </div>
      </div>

      {/* Timeline Controls - Hide most on mobile */}
      <div className="timeline-controls p-4 border-b flex items-center gap-2 overflow-x-auto" style={{ borderColor: '#2C2C2E' }}>
        <button
          onClick={handleZoomIn}
          className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-zinc-800"
          style={{ color: '#9CA3AF', border: '1px solid #2C2C2E' }}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
          <span className="hidden sm:inline ml-1.5">In</span>
        </button>
        <button
          onClick={handleZoomOut}
          className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-zinc-800"
          style={{ color: '#9CA3AF', border: '1px solid #2C2C2E' }}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
          <span className="hidden sm:inline ml-1.5">Out</span>
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => {
              if (timeline) {
                const window = timeline.getWindow()
                const interval = window.end.getTime() - window.start.getTime()
                const distance = interval * 0.2
                const newStart = new Date(window.start.getTime() - distance)
                const newEnd = new Date(window.end.getTime() - distance)
                timeline.setWindow(newStart, newEnd)
              }
            }}
            className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-zinc-800"
            style={{ color: '#9CA3AF', border: '1px solid #2C2C2E' }}
            title="Move Left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (timeline) {
                const window = timeline.getWindow()
                const interval = window.end.getTime() - window.start.getTime()
                const distance = interval * 0.2
                const newStart = new Date(window.start.getTime() + distance)
                const newEnd = new Date(window.end.getTime() + distance)
                timeline.setWindow(newStart, newEnd)
              }
            }}
            className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-zinc-800"
            style={{ color: '#9CA3AF', border: '1px solid #2C2C2E' }}
            title="Move Right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={handleFitAll}
          className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium transition-colors hover:bg-zinc-800"
          style={{ color: '#9CA3AF', border: '1px solid #2C2C2E' }}
        >
          Fit All
        </button>
      </div>

      {/* Timeline Options - Collapse on mobile */}
      <details className="border-b" style={{ borderColor: '#2C2C2E' }}>
        <summary className="p-4 cursor-pointer text-sm font-medium" style={{ color: '#D1D5DB' }}>
          <span className="sm:hidden">Options</span>
          <span className="hidden sm:inline">Timeline Options</span>
        </summary>
        <div className="timeline-options px-4 pb-4 flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="showMajorLabel" checked={showMajorLabel} onCheckedChange={(checked) => setShowMajorLabel(checked as boolean)} />
            <label
              htmlFor="showMajorLabel"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              style={{ color: '#D1D5DB' }}
            >
              <span className="hidden sm:inline">Show </span>Major Label
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="showMinorLabel" checked={showMinorLabel} onCheckedChange={(checked) => setShowMinorLabel(checked as boolean)} />
            <label
              htmlFor="showMinorLabel"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              style={{ color: '#D1D5DB' }}
            >
              <span className="hidden sm:inline">Show </span>Minor Label
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="isDraggable" checked={isDraggable} onCheckedChange={(checked) => setIsDraggable(checked as boolean)} />
            <label
              htmlFor="isDraggable"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              style={{ color: '#D1D5DB' }}
            >
              Draggable<span className="hidden sm:inline"> Scenes</span>
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="allowZoom" checked={allowZoom} onCheckedChange={(checked) => setAllowZoom(checked as boolean)} />
            <label
              htmlFor="allowZoom"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              style={{ color: '#D1D5DB' }}
            >
              <span className="hidden sm:inline">Allow </span>Zoom
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="showCharacters" checked={showCharacters} onCheckedChange={(checked) => setShowCharacters(checked as boolean)} />
            <label
              htmlFor="showCharacters"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              style={{ color: '#D1D5DB' }}
            >
              <span className="hidden sm:inline">Show </span>Characters
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="showLocations" checked={showLocations} onCheckedChange={(checked) => setShowLocations(checked as boolean)} />
            <label
              htmlFor="showLocations"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              style={{ color: '#D1D5DB' }}
            >
              <span className="hidden sm:inline">Show </span>Locations
            </label>
          </div>
        </div>
      </details>

      {/* Timeline Container - Optimized for mobile scrolling */}
      <div ref={timelineRef} className="timeline-container flex-1 overflow-auto touch-pan-x touch-pan-y" style={{ backgroundColor: '#1C1C1E', minHeight: 0 }} />
    </div>
  )
}

