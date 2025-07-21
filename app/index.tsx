// app/index.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, SafeAreaView, StyleSheet, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function Home() {
  const router = useRouter();
  const { date: newEventDate } = useLocalSearchParams<{ date?: string }>();

  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});

  const markDate = useCallback((date: string) => {
    setMarkedDates((prev) => ({
      ...prev,
      [date]: {
        selected: true,
        marked: true,
        selectedColor: 'blue',
      },
    }));
  }, []);

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.calendarContainer}>
        <Calendar
          markedDates={{
            ...markedDates,
            ...(selectedDate && {
              [selectedDate]: {
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
});
