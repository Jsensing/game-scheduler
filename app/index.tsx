// app/index.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STORAGE_KEY = 'calendar_events';

type Event = {
  date: string;
  name: string;
};

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // ✅ Hook placed at top of component

  const { date: newEventDate, name: newEventName } =
    useLocalSearchParams<{ date?: string; name?: string }>();

  const [selectedDate, setSelectedDate] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Load events from storage
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        if (Array.isArray(parsed)) {
          setEvents(parsed);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Save events to storage
  const saveEvents = async (updated: Event[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save events:', err);
    }
  };

  // Add event when returning from /create
  useEffect(() => {
    if (newEventDate && newEventName) {
      const newEntry = { date: newEventDate, name: newEventName };

      setEvents((prev) => {
        const updated = [...prev, newEntry];
        saveEvents(updated);
        return updated;
      });
    }
  }, [newEventDate, newEventName]);

  const filteredEvents = events.filter((e) => e.date === selectedDate);

  const markedDates = events.reduce((acc, e) => {
    acc[e.date] = {
      marked: true,
      selected: e.date === selectedDate,
      selectedColor: 'blue',
    };
    return acc;
  }, {} as Record<string, any>);

  const handleCreate = () => {
    if (!selectedDate) {
      Alert.alert('Please select a date first');
      return;
    }

    router.push({
      pathname: '/create',
      params: { date: selectedDate },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.calendarContainer}>
        <Calendar
          markedDates={{
            ...markedDates,
            ...(selectedDate && {
              [selectedDate]: {
                ...markedDates[selectedDate],
                selected: true,
                selectedColor: 'green',
              },
            }),
          }}
          onDayPress={(day) => setSelectedDate(day.dateString)}
        />

        <View style={styles.eventList}>
          <Text style={styles.label}>
            {selectedDate
              ? `Events on ${selectedDate}`
              : 'Select a date to view events'}
          </Text>

          {filteredEvents.length === 0 ? (
            <Text style={styles.noEvents}>No events for this day</Text>
          ) : (
            <FlatList
              data={filteredEvents}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <Text style={styles.eventItem}>• {item.name}</Text>
              )}
            />
          )}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Button
          title="Create Event"
          onPress={handleCreate}
          disabled={!selectedDate}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  calendarContainer: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 10,
  },
  footer: {
    paddingTop: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: 'white',
  },
  eventList: {
    marginTop: 20,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  noEvents: {
    fontStyle: 'italic',
    color: '#888',
  },
  eventItem: {
    fontSize: 15,
    marginBottom: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
