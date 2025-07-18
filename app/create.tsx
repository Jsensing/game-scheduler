// app/create.js
import { StyleSheet, Text, View } from 'react-native';

export default function CreateEventScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Create Event Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
  },
});
