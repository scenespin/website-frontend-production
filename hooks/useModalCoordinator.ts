'use client';

import { useState, useCallback } from 'react';

/**
 * Modal types that can be displayed in the editor
 */
export type ModalType = 
    | 'selectionToolbar'
    | 'contextMenu' 
    | 'entityAutocomplete'
    | 'importReview'
    | 'textComparison'
    | 'importNotification'
    | null;

interface ModalPosition {
    x?: number;
    y?: number;
    top?: number;
    left?: number;
}

interface UseModalCoordinatorReturn {
    activeModal: ModalType;
    modalData: any;
    modalPosition: ModalPosition;
    openModal: (type: ModalType, data?: any, position?: ModalPosition) => void;
    closeModal: () => void;
    isOpen: (type: ModalType) => boolean;
}

/**
 * Custom hook to coordinate multiple modal/overlay systems
 * Prevents multiple modals from being open simultaneously
 * Provides consistent Z-index management
 * 
 * Consolidates 6 separate overlay systems:
 * - Selection Toolbar
 * - Context Menu
 * - Entity Autocomplete
 * - Import Review Modal
 * - Text Comparison Modal
 * - Import Notification
 */
export function useModalCoordinator(): UseModalCoordinatorReturn {
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [modalData, setModalData] = useState<any>(null);
    const [modalPosition, setModalPosition] = useState<ModalPosition>({});
    
    /**
     * Open a modal (closes any existing modal first)
     */
    const openModal = useCallback((type: ModalType, data?: any, position?: ModalPosition) => {
        console.log('[useModalCoordinator] Opening modal:', type);
        
        // Close any existing modal first
        if (activeModal && activeModal !== type) {
            console.log('[useModalCoordinator] Closing existing modal:', activeModal);
        }
        
        setActiveModal(type);
        setModalData(data);
        setModalPosition(position || {});
    }, [activeModal]);
    
    /**
     * Close the active modal
     */
    const closeModal = useCallback(() => {
        console.log('[useModalCoordinator] Closing modal:', activeModal);
        setActiveModal(null);
        setModalData(null);
        setModalPosition({});
    }, [activeModal]);
    
    /**
     * Check if a specific modal is open
     */
    const isOpen = useCallback((type: ModalType) => {
        return activeModal === type;
    }, [activeModal]);
    
    return {
        activeModal,
        modalData,
        modalPosition,
        openModal,
        closeModal,
        isOpen
    };
}

