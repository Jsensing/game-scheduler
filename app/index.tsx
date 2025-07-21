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

const STORAGE_KEY = 'calendar_events';

type Event = {
  date: string;
  name: string;
};

export default function Home() {
  const router = useRouter();
  const { date: newEventDate, name: newEventName } =
    useLocalSearchParams<{ date?: string; name?: string }>();

  const [selectedDate, setSelectedDate] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Load events from AsyncStorage
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setEvents(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Save events to AsyncStorage
  const saveEvents = async (updatedEvents: Event[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEvents));
    } catch (err) {
      console.error('Failed to save events:', err);
    }
  };

  // When returning from /create
  useEffect(() => {
    if (newEventDate && newEventName) {
      const newEntry = { date: newEventDate, name: newEventName };
      const updatedEvents = [...events, newEntry];
      setEvents(updatedEvents);
      saveEvents(updatedEvents);
    }
  }, [newEventDate, newEventName]);

  // Get events for selected date
  const filteredEvents = events.filter((event) => event.date === selectedDate);

  // Convert to markedDates
  const markedDates = events.reduce((acc, event) => {
    acc[event.date] = {
      marked: true,
      selected: event.date === selectedDate,
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
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
          }}
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

      <View style={styles.footer}>
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
  },
  calendarContainer: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 10,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  eventList: {
    marginTop: 20,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 16,
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
