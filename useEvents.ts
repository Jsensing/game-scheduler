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

export function useEvents() {
  const [events, setEvents] = useState<{ id: string; name: string; date: string }[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'events'),
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...(data as { name: string; date: string }),
          };
        });
        setEvents(fetched);
      },
      (error) => {
        console.error('❌ Firestore onSnapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const addEvent = async (name: string, date: string) => {
    const duplicate = events.some(
      (e) =>
        e.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        e.date === date
    );
    if (duplicate) return false;

    try {
      await addDoc(collection(db, 'events'), {
        name,
        date, // Pass in the selectedDate
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
      await deleteDoc(doc(db, 'events', id));
      console.log(`🗑️ Event with ID ${id} deleted`);
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
    }
  };

  const editEvent = async (id: string, newName: string) => {
    try {
      await updateDoc(doc(db, 'events', id), {
        name: newName,
      });
      console.log(`✏️ Event with ID ${id} updated`);
    } catch (error) {
      console.error('❌ Failed to update event:', error);
    }
  };

  return { events, addEvent, deleteEvent, editEvent };
}
