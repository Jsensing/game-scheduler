// app/index.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Button, SafeAreaView, StyleSheet, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function Home() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();

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

  // When returning from the create screen with a date
  React.useEffect(() => {
    if (params?.date) {
      markDate(params.date);
    }
  }, [params?.date]);

  return (
    <SafeAreaView style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => {
          console.log('Selected:', day.dateString);
        }}
      />

      <View style={styles.buttonContainer}>
        <Button title="Create Event" onPress={() => router.push('/create')} />
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
