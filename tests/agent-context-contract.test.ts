import assert from 'node:assert/strict';
import { buildEnrichedAgentContext } from '../utils/agentContextContract';

const sceneContext = {
  heading: 'INT. OFFICE - NIGHT',
  act: 2,
  characters: ['JANE', 'MARCUS'],
  startLine: 10,
  endLine: 40,
  pageNumber: 3,
  totalPages: 90
};

const scenes = [
  {
    id: 'scene-1',
    heading: 'INT. OFFICE - NIGHT',
    fountain: {
      startLine: 10,
      endLine: 42,
      tags: {
        characters: ['char-1', 'char-2'],
        location: 'loc-1',
        props: ['asset-1', 'asset-2']
      }
    }
  }
];

const characters = [
  {
    id: 'char-1',
    name: 'Jane',
    type: 'lead',
    arcStatus: 'developing',
    arcNotes: 'She is afraid of failing the mission. She refuses to quit.',
    description: 'Disciplined strategist who hides fear.',
    physicalAttributes: { height: 'average', eyeColor: 'green' }
  },
  {
    id: 'char-2',
    name: 'Marcus',
    type: 'supporting',
    arcStatus: 'introduced',
    description: 'Impulsive hacker with a dry sense of humor.'
  }
];

const locations = [
  {
    id: 'loc-1',
    name: 'Operations Office',
    type: 'INT',
    description: 'A narrow room lined with blinking monitors.',
    atmosphereNotes: 'Claustrophobic and urgent.',
    setRequirements: 'Banks of monitors and old cables.'
  }
];

const assets = [
  {
    id: 'asset-1',
    name: 'Encrypted Flash Drive',
    category: 'prop',
    description: 'A worn drive with a cracked red casing.'
  },
  {
    id: 'asset-2',
    name: 'Signal Jammer',
    category: 'other',
    description: 'Blocks all outgoing radio traffic in a 20 meter radius.'
  }
];

function run() {
  const result = buildEnrichedAgentContext({
    lane: 'director',
    sceneContext,
    scenes,
    characters,
    locations,
    assets
  });

  assert.equal(result.metrics.enabled, true);
  assert.equal(result.metrics.capChars, 1200);
  assert.ok(result.text.includes('[SCENE CORE]'));
  assert.ok(result.text.includes('[CHARACTER DOSSIERS]'));
  assert.ok(result.text.includes('[LOCATION PROFILE - CURRENT SCENE]'));
  assert.ok(result.text.includes('[SCENE PROPS - LINKED ONLY]'));
  assert.ok(result.metrics.totalChars <= result.metrics.capChars);

  const rewriteResult = buildEnrichedAgentContext({
    lane: 'rewrite',
    sceneContext,
    scenes,
    characters,
    locations,
    assets
  });
  assert.equal(rewriteResult.metrics.capChars, 900);
  assert.ok(rewriteResult.metrics.totalChars <= 900);

  console.log('agent-context-contract.test.ts: PASS');
}

run();
