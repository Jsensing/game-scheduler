// app/index.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

const STORAGE_KEY = 'calendar_events';

type Event = {
  date: string;
  name: string;
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [eventName, setEventName] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Load events from storage
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        if (Array.isArray(parsed)) {
          setEvents(parsed);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    };

    loadEvents();
  }, []);

  // Save to storage
  const saveEvents = async (updated: Event[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save events:', err);
    }
  };

  const handleSaveEvent = () => {
    if (!eventName.trim()) {
      Alert.alert('Event name required');
      return;
    }

    const newEntry = { date: selectedDate, name: eventName };
    const updated = [...events, newEntry];
    setEvents(updated);
    saveEvents(updated);
    setEventName('');
    setCreateModalVisible(false);

    const duplicate = events.find(
      (e) => e.date === selectedDate && e.name === eventName
    );
    if (duplicate) {
      Alert.alert('Event already exists for this date');
      return;
    }

  };

  const handleDeleteEvent = (eventToDelete: Event) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${eventToDelete.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = events.filter(
              (e) =>
                !(e.date === eventToDelete.date && e.name === eventToDelete.name)
            );
            setEvents(updated);
            saveEvents(updated);
            setDetailModalVisible(false);
          },
        },
      ]
    );
  };

  const filteredEvents = events.filter((e) => e.date === selectedDate);

  const markedDates = events.reduce((acc, e) => {
    acc[e.date] = {
      marked: true,
      selected: e.date === selectedDate,
      selectedColor: 'blue',
    };
    return acc;
  }, {} as Record<string, any>);

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
                <Pressable
                  onPress={() => {
                    setSelectedEvent(item);
                    setDetailModalVisible(true);
                  }}
                >
                  <Text style={styles.eventItem}>• {item.name}</Text>
                </Pressable>
              )}
            />
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Create Event"
          onPress={() => setCreateModalVisible(true)}
          disabled={!selectedDate}
        />
      </View>

      {/* Create Event Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.label}>Event Name:</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Meeting"
                value={eventName}
                onChangeText={setEventName}
              />
              <Button title="Save Event" onPress={handleSaveEvent} />
              <View style={{ marginTop: 10 }}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setCreateModalVisible(false);
                    setEventName('');
                  }}
                  color="#888"
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Event Detail Modal */}
      <Modal
  visible={detailModalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setDetailModalVisible(false)}
>
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.label}>Event:</Text>

        {isEditing ? (
          <>
            <TextInput
              style={styles.input}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Edit event name"
            />
            <Button
              title="Save Changes"
              onPress={() => {
                if (!selectedEvent) return;
                const updatedEvents = events.map((e) =>
                  e.date === selectedEvent.date && e.name === selectedEvent.name
                    ? { ...e, name: editedName }
                    : e
                );
                setEvents(updatedEvents);
                saveEvents(updatedEvents);
                setSelectedEvent({ ...selectedEvent, name: editedName });
                setIsEditing(false);
                setDetailModalVisible(false);
                setEditedName('');
              }}
            />
            <View style={{ marginTop: 10 }}>
              <Button
                title="Cancel"
                onPress={() => {
                  setIsEditing(false);
                  setEditedName('');
                }}
                color="#888"
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.eventItem}>{selectedEvent?.name}</Text>

            <View style={{ marginTop: 10 }}>
              <Button
                title="Edit Event"
                onPress={() => {
                  setIsEditing(true);
                  setEditedName(selectedEvent?.name ?? '');
                }}
              />
            </View>

            <View style={{ marginTop: 10 }}>
              <Button
                title="Delete Event"
                color="red"
                onPress={() => {
                  if (selectedEvent) {
                    handleDeleteEvent(selectedEvent);
                  }
                }}
              />
            </View>

            <View style={{ marginTop: 10 }}>
              <Button
                title="Close"
                onPress={() => {
                  setDetailModalVisible(false);
                  setIsEditing(false);
                  setEditedName('');
                }}
                color="#888"
              />
            </View>
          </>
        )}
      </View>
    </View>
  </TouchableWithoutFeedback>
</Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
    fontSize: 16,
    marginBottom: 5,
  },
  noEvents: {
    fontStyle: 'italic',
    color: '#888',
  },
  eventItem: {
    fontSize: 15,
    marginBottom: 8,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});
