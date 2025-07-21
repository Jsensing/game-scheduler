// app/create.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function CreateEventScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const [eventName, setEventName] = useState('');

  const handleSubmit = () => {
    if (!eventName) {
      Alert.alert('Please enter an event name');
      return;
    }

    // For now, we just go back and pass the date (name could be added later)
    router.push({
    pathname: '/',
    params: { date, name: eventName },
    });

  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Selected Date:</Text>
      <Text style={styles.date}>{date}</Text>

      <Text style={styles.label}>Event Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Chess Tournament"
        value={eventName}
        onChangeText={setEventName}
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
  date: {
    fontSize: 18,
    marginBottom: 20,
    color: '#2e86de',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
});
