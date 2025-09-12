import { Picker } from '@react-native-picker/picker';
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
  TouchableOpacity,
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

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 21 }, (_, i) => `${currentYear - 10 + i}`);

export default function Home() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState('');
  const [eventName, setEventName] = useState('');
  const [editedName, setEditedName] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
  );

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
            [{ text: 'OK', onPress: () => Updates.reloadAsync() }],
            { cancelable: false }
          );
        }
      } catch (e) {
        console.log('Error checking for updates:', e);
      }
    };

    checkForUpdate();
  }, []);

  const getColorForEventName = (name: string) => {
    switch (name) {
      case 'Dnd': return '#90ee90';
      case 'Game Night': return '#FFD700';
      case 'Canceled': return '#FF6347';
      default: return '#ccc';
    }
  };

  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};

    events.forEach((e) => {
      const isSelected = e.date === selectedDate;
      const bgColor = getColorForEventName(e.name);

      marked[e.date] = {
        customStyles: {
          container: {
            backgroundColor: bgColor,
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected ? 'blue' : 'transparent',
          },
          text: {
            color: 'white',
            fontWeight: isSelected ? 'bold' : 'normal',
          },
        },
      };
    });

    if (selectedDate && !marked[selectedDate]) {
      marked[selectedDate] = {
        customStyles: {
          container: {
            backgroundColor: 'white',
            borderWidth: 2,
            borderColor: 'blue',
          },
          text: {
            color: 'black',
            fontWeight: 'bold',
          },
        },
      };
    }

    return marked;
  }, [events, selectedDate]);

  const handleSaveEventWrapper = async (finalName: string) => {
    const success = await addEvent(finalName, selectedDate);
    if (!success) {
      Alert.alert('Duplicate Event', 'An event with the same name already exists on this day.');
      return;
    }

    setEventName('');
    setEditedName('');
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

  const filteredEvents = events.filter((e) => e.date === selectedDate);

    useEffect(() => {
    if (detailModalVisible && selectedEvent) {
      const name = selectedEvent.name;
      if (['Dnd', 'Game Night', 'Canceled'].includes(name)) {
        setEventName(name);
        setEditedName('');
      } else {
        setEventName('Custom');
        setEditedName(name);
      }
    }
  }, [detailModalVisible, selectedEvent]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.calendarContainer}>
        <Calendar
          key={currentDate}
          markingType="custom"
          markedDates={markedDates}
          current={currentDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          renderHeader={() => (
            <TouchableOpacity onPress={() => setMonthPickerVisible(true)}>
              <Text style={styles.calendarHeader}>
                {monthNames[calendarMonth]} {calendarYear}
              </Text>
            </TouchableOpacity>
          )}
          onMonthChange={(month) => {
            setCalendarMonth(month.month - 1);
            setCalendarYear(month.year);
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
                    setEventName(['Dnd', 'Game Night', 'Canceled'].includes(item.name) ? item.name : 'Custom');
                    setEditedName(['Dnd', 'Game Night', 'Canceled'].includes(item.name) ? '' : item.name);
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
      <Modal visible={createModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.label}>Select Event Type</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={eventName}
                  onValueChange={(value) => setEventName(value)}
                >
                  <Picker.Item label="Select an event..." value="" color="#888" />
                  <Picker.Item label="DnD" value="Dnd" color="#888" />
                  <Picker.Item label="Game Night" value="Game Night" color="#888" />
                  <Picker.Item label="Canceled" value="Canceled" color="#888" />
                  <Picker.Item label="Custom" value="Custom" color="#888" />
                </Picker>
              </View>

              {eventName === 'Custom' && (
                <>
                  <Text style={styles.label}>Enter Custom Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter event name"
                    value={editedName}
                    onChangeText={setEditedName}
                  />
                </>
              )}

              <Button
                title="Save"
                onPress={() => {
                  const finalName = eventName === 'Custom' ? editedName.trim() : eventName.trim();
                  if (!finalName) {
                    Alert.alert('Event name required');
                    return;
                  }
                  handleSaveEventWrapper(finalName);
                }}
              />
              <Button
                title="Cancel"
                onPress={() => {
                  setEventName('');
                  setEditedName('');
                  setCreateModalVisible(false);
                }}
                color="gray"
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Detail/Edit Event Modal */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.label}>Edit Event</Text>

              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={eventName}
                  onValueChange={(value) => setEventName(value)}
                >
                  <Picker.Item label="DnD" value="Dnd" color="#888" />
                  <Picker.Item label="Game Night" value="Game Night" color="#888" />
                  <Picker.Item label="Canceled" value="Canceled" color="#888" />
                  <Picker.Item label="Custom" value="Custom" color="#888" />
                </Picker>
              </View>

              {eventName === 'Custom' && (
                <>
                  <Text style={styles.label}>Custom Event Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter custom name"
                    value={editedName}
                    onChangeText={setEditedName}
                  />
                </>
              )}

              {/* Spaced Buttons */}
              <View style={{ marginTop: 20 }}>
                <View style={{ marginBottom: 10 }}>
                  <Button
                    title="Save Changes"
                    onPress={() => {
                      const finalName = eventName === 'Custom' ? editedName.trim() : eventName.trim();
                      if (!finalName || !selectedEvent) {
                        Alert.alert('Event name required');
                        return;
                      }
                      editEvent(selectedEvent.id, finalName);
                      setDetailModalVisible(false);
                      setSelectedEvent(null);
                      setEventName('');
                      setEditedName('');
                    }}
                  />
                </View>

                <View style={{ marginBottom: 10 }}>
                  <Button
                    title="Delete"
                    color="red"
                    onPress={() => {
                      if (selectedEvent) handleDeleteEvent(selectedEvent.id, selectedEvent.name);
                    }}
                  />
                </View>

                <View>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setDetailModalVisible(false);
                      setSelectedEvent(null);
                      setEventName('');
                      setEditedName('');
                    }}
                    color="gray"
                  />
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Month-Year Picker Modal */}
      <Modal visible={monthPickerVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.label}>Select Month and Year</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={calendarMonth}
                  onValueChange={(value) => setCalendarMonth(Number(value))}
                >
                  {monthNames.map((month, idx) => (
                    <Picker.Item key={month} label={month} value={idx} />
                  ))}
                </Picker>
              </View>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={calendarYear}
                  onValueChange={(value) => setCalendarYear(Number(value))}
                >
                  {yearOptions.map((year) => (
                    <Picker.Item key={year} label={year} value={Number(year)} />
                  ))}
                </Picker>
              </View>
              <Button
                title="Done"
                onPress={() => {
                  const newDate = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-01`;
                  setCurrentDate(newDate);
                  setMonthPickerVisible(false);
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  calendarContainer: { flex: 1, paddingTop: 50, paddingHorizontal: 10 },
  calendarHeader: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    padding: 10,
    color: '#333',
  },
  footer: { backgroundColor: '#fff' },
  footerInner: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 30 },
  eventList: { marginTop: 20 },
  label: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  noEvents: { fontStyle: 'italic', color: '#888' },
  eventItem: { fontSize: 15, marginBottom: 8 },
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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 15,
  },
});
