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

interface Event {
  id: string;
  name: string;
  date: string;
  type: 'Dnd' | 'Game Night' | 'Canceled';
}

const COLLECTION_NAME = Constants.expoConfig?.extra?.USE_DEV_COLLECTION ? 'events_dev' : 'events';

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
        console.error('❌ Firestore onSnapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

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
        type: trimmed as Event['type'], // cast to known type
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

  return { events, addEvent, deleteEvent, editEvent };
}
