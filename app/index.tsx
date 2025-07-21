import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

const STORAGE_KEY = 'calendar_events';

export default function Home() {
  const router = useRouter();
  const { date: newEventDate } = useLocalSearchParams<{ date?: string }>();

  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Load events on app start
  useEffect(() => {
    const loadMarkedDates = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setMarkedDates(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMarkedDates();
  }, []);

  // Save events to storage
  const saveMarkedDates = async (dates: Record<string, any>) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dates));
    } catch (err) {
      console.error('Failed to save events:', err);
    }
  };

  // Add a new event date
  const markDate = useCallback((date: string) => {
    const updated = {
      ...markedDates,
      [date]: {
        selected: true,
        marked: true,
        selectedColor: 'blue',
      },
    };

    setMarkedDates(updated);
    saveMarkedDates(updated);
  }, [markedDates]);

  // Handle date returned from /create
  useEffect(() => {
    if (newEventDate) {
      markDate(newEventDate);
    }
  }, [newEventDate]);

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
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
