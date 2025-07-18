import { useRouter } from 'expo-router';
import React from 'react';
import { Button, SafeAreaView, StyleSheet, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function Home() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Calendar
        onDayPress={(day) => {
          console.log('Selected day:', day);
        }}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Create Event"
          onPress={() => router.push('/create' as any)}
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
