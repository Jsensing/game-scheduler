// app/create.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function CreateEventScreen() {
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const handleSubmit = () => {
    if (!eventName || !selectedDate) {
      Alert.alert('Please enter an event name and select a date');
      return;
    }

    // For now we just pass the selected date back
    router.push({
      pathname: '/',
      params: { date: selectedDate },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Event Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. DnD Game Night"
        value={eventName}
        onChangeText={setEventName}
      />

      <Text style={styles.label}>Select Date:</Text>
      <Calendar
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
        }}
        markedDates={
          selectedDate
            ? {
                [selectedDate]: {
                  selected: true,
                  selectedColor: 'green',
                },
              }
            : {}
        }
      />

      <Button title="Save Event" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
});
