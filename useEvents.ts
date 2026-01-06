import Constants from 'expo-constants';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebase';

/**
 * Event interface defining the structure of calendar events
 */
interface Event {
  id: string;                                    // Firestore document ID
  name: string;                                  // Event name/title
  date: string;                                  // Date in YYYY-MM-DD format
  type: 'Dnd' | 'Game Night' | 'Canceled';      // Event category/type
}

/**
 * Determine which Firestore collection to use based on environment
 * Switches between 'events_dev' (development) and 'events' (production)
 * This allows testing without affecting production data
 */
const COLLECTION_NAME = Constants.expoConfig?.extra?.USE_DEV_COLLECTION ? 'events_dev' : 'events';

/**
 * Custom React hook for managing calendar events in Firestore
 * Provides real-time event synchronization and CRUD operations
 * 
 * @returns {Object} Events array and functions to add, delete, and edit events
 */
export function useEvents() {
  // State to store all events, automatically synced with Firestore
  const [events, setEvents] = useState<Event[]>([]);

  /**
   * Set up real-time Firestore listener on component mount
   * Automatically updates local state whenever Firestore data changes
   * Cleans up listener on component unmount to prevent memory leaks
   */
  useEffect(() => {
    // Subscribe to real-time updates from Firestore collection
    const unsubscribe = onSnapshot(
      collection(db, COLLECTION_NAME),
      (snapshot) => {
        // Transform Firestore documents into Event objects
        const fetched: Event[] = snapshot.docs.map((doc) => ({
          id: doc.id,                                    // Include Firestore document ID
          ...(doc.data() as Omit<Event, 'id'>),        // Spread remaining event data
        }));
        // Update local state with fetched events
        setEvents(fetched);
      },
      (error) => {
        // Log any errors that occur during real-time sync
        console.error('⚠️ Firestore onSnapshot error:', error);
      }
    );

    // Cleanup function: unsubscribe from Firestore listener when component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array = run once on mount

  /**
   * Add a new event to Firestore
   * Prevents duplicate events (same name and date)
   * 
   * @param {string} name - Event name/title
   * @param {string} date - Event date in YYYY-MM-DD format
   * @returns {Promise<boolean>} True if event was added, false if duplicate exists
   */
  const addEvent = async (name: string, date: string) => {
    // Trim whitespace from name for consistency
    const trimmed = name.trim();
    
    // Check if event with same name (case-insensitive) already exists on this date
    const duplicate = events.some(
      (e) => e.name.trim().toLowerCase() === trimmed.toLowerCase() && e.date === date
    );
    
    // Prevent duplicate events
    if (duplicate) return false;

    try {
      // Add new document to Firestore collection
      await addDoc(collection(db, COLLECTION_NAME), {
        name: trimmed,
        date,
        type: trimmed as Event['type'], // Cast to known event type
      });
      console.log(' Event added to Firebase');
      return true;
    } catch (error) {
      console.error(' Failed to add event:', error);
      return false;
    }
  };

  /**
   * Delete an event from Firestore by its ID
   * 
   * @param {string} id - Firestore document ID of the event to delete
   */
  const deleteEvent = async (id: string) => {
    try {
      // Delete document from Firestore using its ID
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      console.log(` Event with ID ${id} deleted`);
    } catch (error) {
      console.error(' Failed to delete event:', error);
    }
  };

  /**
   * Update an existing event in Firestore
   * Can update name and/or type
   * 
   * @param {string} id - Firestore document ID of the event to update
   * @param {string} newName - New event name/title
   * @param {Event['type']} newType - Optional new event type
   */
  const editEvent = async (id: string, newName: string, newType?: Event['type']) => {
    try {
      // Build update object with new name
      const updateData: Partial<Omit<Event, 'id'>> = { name: newName };
      
      // Add type to update if provided
      if (newType) updateData.type = newType;

      // Update Firestore document with new data
      await updateDoc(doc(db, COLLECTION_NAME, id), updateData);
      console.log(` Event with ID ${id} updated`);
    } catch (error) {
      console.error(' Failed to update event:', error);
    }
  };

  // Return events array and CRUD functions for use in components
  return { events, addEvent, deleteEvent, editEvent };
}