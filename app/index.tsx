import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <Calendar
        onDayPress={(day) => {
          console.log('Selected day:', day);
        }}
        markedDates={{
          '2025-07-18': { selected: true, marked: true, selectedColor: 'blue' },
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
});
