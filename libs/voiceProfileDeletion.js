/**
 * Voice Profile Integration Utilities
 * 
 * Helper functions for integrating MongoDB voice consent
 * with DynamoDB voice profiles.
 * 
 * Used when consent is revoked to delete all associated voice profiles.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const VOICE_PROFILES_TABLE = process.env.DYNAMODB_VOICE_PROFILES_TABLE || 'VoiceProfiles';

/**
 * Get all voice profiles for a user
 * 
 * Note: Voice profiles use characterId as primary key, not userId,
 * so we need to scan the table to find all profiles belonging to a user.
 */
export async function getVoiceProfilesByUserId(userId) {
  try {
    const command = new ScanCommand({
      TableName: VOICE_PROFILES_TABLE,
      FilterExpression: 'rightsConfirmedBy = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });

    const response = await docClient.send(command);
    return response.Items || [];
  } catch (error) {
    console.error('Error fetching voice profiles:', error);
    throw new Error(`Failed to fetch voice profiles: ${error.message}`);
  }
}

/**
 * Delete a voice profile by characterId
 */
export async function deleteVoiceProfile(characterId) {
  try {
    const command = new DeleteCommand({
      TableName: VOICE_PROFILES_TABLE,
      Key: { characterId },
    });

    await docClient.send(command);
  } catch (error) {
    console.error(`Error deleting voice profile ${characterId}:`, error);
    throw new Error(`Failed to delete voice profile: ${error.message}`);
  }
}

/**
 * Delete all voice profiles for a user
 * 
 * Called when consent is revoked.
 * Deletes all voice profiles associated with the user.
 * 
 * Returns: Number of profiles deleted
 */
export async function deleteAllUserVoiceProfiles(userId) {
  try {
    // Get all profiles for this user
    const profiles = await getVoiceProfilesByUserId(userId);

    if (profiles.length === 0) {
      return 0;
    }

    // Delete each profile
    const deletePromises = profiles.map((profile) =>
      deleteVoiceProfile(profile.characterId)
    );

    await Promise.all(deletePromises);

    return profiles.length;
  } catch (error) {
    console.error('Error deleting user voice profiles:', error);
    throw error;
  }
}

/**
 * Optional: Delete voice from ElevenLabs
 * 
 * This is OPTIONAL - ElevenLabs voices belong to the user's ElevenLabs account,
 * not your platform. Deleting from ElevenLabs would remove it from their account.
 * 
 * Only call this if you're managing cloned voices on behalf of users.
 */
export async function deleteElevenLabsVoice(voiceId, encryptedApiKey) {
  // Implementation would require:
  // 1. Decrypt API key using AWS KMS
  // 2. Call ElevenLabs DELETE /v1/voices/{voiceId}
  // 
  // Since this is the user's personal ElevenLabs account,
  // we typically DON'T delete from ElevenLabs - just from our database.
  
  console.log(`Note: Voice ${voiceId} not deleted from ElevenLabs (user's personal account)`);
}

export default {
  getVoiceProfilesByUserId,
  deleteVoiceProfile,
  deleteAllUserVoiceProfiles,
  deleteElevenLabsVoice,
};

