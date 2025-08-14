import * as Updates from 'expo-updates';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEvents } from '../useEvents';

interface Event {
  id: string;
  name: string;
  date: string;
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState('');
  const [eventName, setEventName] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');

  const { events, addEvent, deleteEvent, editEvent } = useEvents();

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert(
            'Update Available',
            'Update installed, please restart the app to apply the update.',
            [
              {
                text: 'OK',
                onPress: () => {
                  Updates.reloadAsync(); // reloads the app
                },
              },
            ],
            { cancelable: false }
          );
        }
      } catch (e) {
        console.log('Error checking for updates:', e);
      }
    };

    checkForUpdate();
  }, []);

  const handleSaveEvent = async () => {
    const trimmedName = eventName.trim();
    if (!trimmedName) {
      Alert.alert('Event name required');
      return;
    }
    const success = await addEvent(trimmedName, selectedDate);
    if (!success) {
      Alert.alert('Duplicate Event', 'An event with the same name already exists on this day.');
      return;
    }
    setEventName('');
    setCreateModalVisible(false);
  };

  const handleDeleteEvent = (id: string, name: string) => {
    Alert.alert('Delete Event', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteEvent(id);
          setDetailModalVisible(false);
        },
      },
    ]);
  };

const markedDates = useMemo(() => {
  const marked: Record<string, any> = {};

  // First: mark all dates with events
  events.forEach((e) => {
    marked[e.date] = {
      customStyles: {
        container: {
          backgroundColor: '#90ee90',
          borderRadius: 0,
        },
        text: {
          color: 'white',
        },
      },
    };
  });

  // Then: if selectedDate is also marked, update it with selection styles
  if (selectedDate) {
    if (marked[selectedDate]) {
      // Date has an event → keep green, but bold text and blue border
      marked[selectedDate].customStyles = {
        container: {
          ...marked[selectedDate].customStyles.container,
          borderWidth: 2,
          borderColor: '#007BFF',
        },
        text: {
          ...marked[selectedDate].customStyles.text,
          fontWeight: 'bold',
        },
      };
    } else {
      // Date has no event → apply blue border only
      marked[selectedDate] = {
        customStyles: {
          container: {
            borderWidth: 2,
            borderColor: '#007BFF',
            backgroundColor: 'white',
            borderRadius: 0,
          },
          text: {
            color: '#007BFF',
            fontWeight: 'bold',
          },
        },
      };
    }
  }

  return marked;
}, [events, selectedDate]);


  const filteredEvents = events.filter((e: Event) => e.date === selectedDate);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.calendarContainer}>
        <Calendar
          markingType="custom"
          markedDates={markedDates}
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
          }}
        />

        <View style={styles.eventList}>
          <Text style={styles.label}>
            {selectedDate ? `Events on ${selectedDate}` : 'Pick a date to view events'}
          </Text>

          {filteredEvents.length === 0 ? (
            <Text style={styles.noEvents}>No events for this day</Text>
          ) : (
            <FlatList
              data={filteredEvents}
              keyExtractor={(item) => item.id}
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}
        style={[styles.footer, { paddingBottom: insets.bottom || 20 }]}
      >
        <View style={styles.footerInner}>
          <Button
            title="Create Event"
            onPress={() => setCreateModalVisible(true)}
            disabled={!selectedDate}
          />
        </View>
      </KeyboardAvoidingView>

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
                      editEvent(selectedEvent.id, editedName);
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
                          handleDeleteEvent(selectedEvent.id, selectedEvent.name);
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
    backgroundColor: '#fff',
  },
  footerInner: {
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 30,
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
