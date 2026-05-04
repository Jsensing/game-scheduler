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
 * Now includes RSVP tracking
 */
interface Event {
  id: string;                                    // Firestore document ID
  name: string;                                  // Event name/title
  date: string;                                  // Date in YYYY-MM-DD format
  type: 'Dnd' | 'Game Night' | 'To Be Determined' | 'Canceled';      // Event category/type
  rsvps?: {                                      // Optional array of RSVPs
    username: string;                            // Username of person responding
    status: 'Yes' | 'No' | 'Maybe';             // Their response status
  }[];
}

/**
 * Determine which Firestore collection to use based on environment
 */
const COLLECTION_NAME = Constants.expoConfig?.extra?.USE_DEV_COLLECTION ? 'events_dev' : 'events';

/**
 * Custom React hook for managing calendar events in Firestore
 */
export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, COLLECTION_NAME),
      (snapshot) => {
        const fetched: Event[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Event, 'id'>),
        }));
        setEvents(fetched);
      },
      (error) => {
        console.error('⚠️ Firestore onSnapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Add a new event to Firestore
   * @param {string} name - Event name
   * @param {string} date - Event date in YYYY-MM-DD format
   */
  const addEvent = async (name: string, date: string) => {
    const trimmed = name.trim();
    
    const duplicate = events.some(
      (e) => e.name.trim().toLowerCase() === trimmed.toLowerCase() && e.date === date
    );
    
    if (duplicate) return false;

    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        name: trimmed,
        date,
        type: trimmed as Event['type'],
        rsvps: [],
      });
      console.log('✅ Event added to Firebase');
      return true;
    } catch (error) {
      console.error('❌ Failed to add event:', error);
      return false;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      console.log(`🗑️ Event with ID ${id} deleted`);
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
    }
  };

  const editEvent = async (id: string, newName: string, newType?: Event['type']) => {
    try {
      const updateData: Partial<Omit<Event, 'id'>> = { name: newName };
      if (newType) updateData.type = newType;
      await updateDoc(doc(db, COLLECTION_NAME, id), updateData);
      console.log(`✏️ Event with ID ${id} updated`);
    } catch (error) {
      console.error('❌ Failed to update event:', error);
    }
  };

  const addRSVP = async (
    eventId: string,
    username: string,
    status: 'Yes' | 'No' | 'Maybe'
  ) => {
    try {
      const eventRef = doc(db, COLLECTION_NAME, eventId);
      const event = events.find(e => e.id === eventId);
      
      if (!event) {
        console.error('Event not found');
        return false;
      }

      const currentRSVPs = event.rsvps || [];
      const updatedRSVPs = currentRSVPs.filter(r => r.username !== username);
      updatedRSVPs.push({ username, status });

      await updateDoc(eventRef, { rsvps: updatedRSVPs });
      console.log(`RSVP added for ${username}`);
      return true;
    } catch (error) {
      console.error('Failed to add RSVP:', error);
      return false;
    }
  };

  const removeRSVP = async (eventId: string, username: string) => {
    try {
      const eventRef = doc(db, COLLECTION_NAME, eventId);
      const event = events.find(e => e.id === eventId);
      
      if (!event) {
        console.error('Event not found');
        return false;
      }

      const updatedRSVPs = event.rsvps?.filter(r => r.username !== username) || [];
      await updateDoc(eventRef, { rsvps: updatedRSVPs });
      console.log(`RSVP removed for ${username}`);
      return true;
    } catch (error) {
      console.error('Failed to remove RSVP:', error);
      return false;
    }
  };

  return { 
    events, 
    addEvent, 
    deleteEvent, 
    editEvent,
    addRSVP,
    removeRSVP 
  };
}