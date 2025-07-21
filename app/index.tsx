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

      <View style={styles.buttonContainer}>
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
    paddingTop: 50,
  },
  buttonContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
