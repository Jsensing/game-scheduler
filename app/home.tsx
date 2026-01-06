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

// Type definition for event objects
interface Event {
  id: string;
  name: string;
  date: string;
}

// Array of month names for display purposes
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Generate array of years: 10 years before and after current year
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 21 }, (_, i) => `${currentYear - 10 + i}`);

export default function Home() {
   // Get safe area insets for proper spacing on devices with notches
  const insets = useSafeAreaInsets();
  
  // State for calendar date selection
  const [selectedDate, setSelectedDate] = useState('');
  
  // State for event name input in create modal
  const [eventName, setEventName] = useState('');
  
  // State for custom event name when "Custom" is selected
  const [editedName, setEditedName] = useState('');
  
  // State to control visibility of create event modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  
  // State to control visibility of event detail/edit modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // State to hold the currently selected event for viewing/editing
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // State to track if user is editing an event (unused, can be removed)
  const [isEditing, setIsEditing] = useState(false);
  
  // State to track currently displayed month in calendar
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  
  // State to track currently displayed year in calendar
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  
  // State to control visibility of month/year picker modal
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  
  // State to control which month the calendar displays (formatted as YYYY-MM-01)
  const [currentDate, setCurrentDate] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
  );

  // Custom hook to manage events (CRUD operations)
  const { events, addEvent, deleteEvent, editEvent } = useEvents();

  // Check for over-the-air (OTA) updates on component mount
  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        // Check if an update is available
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          // Download the update
          await Updates.fetchUpdateAsync();
          // Prompt user to restart app to apply update
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

  // Function to determine background color based on event name
  const getColorForEventName = (name: string) => {
    switch (name) {
      case 'Dnd': return '#90ee90';          // Light green
      case 'Game Night': return '#FFD700';   // Gold
      case 'Canceled': return '#FF6347';     // Tomato red
      default: return '#ccc';                // Gray for custom events
    }
  };

  // Memoized object containing styling for marked dates on calendar
  // Recalculates when events or selectedDate changes
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};

    // Mark each date that has an event
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

    // If a date is selected but has no events, mark it with a blue border
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

  // Wrapper function to handle event creation
  const handleSaveEventWrapper = async (finalName: string) => {
    // Attempt to add the event
    const success = await addEvent(finalName, selectedDate);
    
    // If event already exists on this date, show alert
    if (!success) {
      Alert.alert('Duplicate Event', 'An event with the same name already exists on this day.');
      return;
    }
    
    // Reset form and close modal on success
    setEventName('');
    setEditedName('');
    setCreateModalVisible(false);
  };

  // Function to handle event deletion with confirmation
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

  // Filter events to show only those on the selected date
  const filteredEvents = events.filter((e) => e.date === selectedDate);

  // Pre-fill the edit modal when it opens
  // Sets the picker to the correct value and custom name if applicable
  useEffect(() => {
    if (detailModalVisible && selectedEvent) {
      const name = selectedEvent.name;
      // If it's a predefined event type, set picker value
      if (['Dnd', 'Game Night', 'Canceled'].includes(name)) {
        setEventName(name);
        setEditedName('');
      } else {
        // If it's a custom event, set picker to "Custom" and populate custom name
        setEventName('Custom');
        setEditedName(name);
      }
    }
  }, [detailModalVisible, selectedEvent]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Main calendar and event list container */}
      <View style={styles.calendarContainer}>
        {/* Calendar component with custom styling and event markers */}
        <Calendar
          key={currentDate}
          markingType="custom"
          markedDates={markedDates}
          current={currentDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          // Custom header showing month and year (tappable to open picker)
          renderHeader={() => (
            <TouchableOpacity onPress={() => setMonthPickerVisible(true)}>
              <Text style={styles.calendarHeader}>
                {monthNames[calendarMonth]} {calendarYear}
              </Text>
            </TouchableOpacity>
          )}
          // Update state when user swipes to different month
          onMonthChange={(month) => {
            setCalendarMonth(month.month - 1);
            setCalendarYear(month.year);
          }}
        />

        {/* Event list section showing events for selected date */}
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
                    // Set up state for editing the selected event
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

      {/* Fixed footer with Create Event button */}
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

      {/* Modal for creating a new event */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.label}>Select Event Type</Text>
              
              {/* Picker for selecting event type */}
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={eventName}
                  onValueChange={(value) => setEventName(value)}
                >
                  <Picker.Item label="Select an event..." value="" color="#000" />
                  <Picker.Item label="DnD" value="Dnd" color="#000" />
                  <Picker.Item label="Game Night" value="Game Night" color="#000" />
                  <Picker.Item label="Canceled" value="Canceled" color="#000" />
                  <Picker.Item label="Custom" value="Custom" color="#000" />
                </Picker>
              </View>

              {/* Show custom name input only when "Custom" is selected */}
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

              {/* Action buttons */}
              <View style={{ marginTop: 20 }}>
                <View style={{ marginBottom: 10 }}>
                  <Button
                    title="Save"
                    onPress={() => {
                      // Get final name based on whether custom or predefined
                      const finalName = eventName === 'Custom' ? editedName.trim() : eventName.trim();
                      if (!finalName) {
                        Alert.alert('Event name required');
                        return;
                      }
                      handleSaveEventWrapper(finalName);
                    }}
                  />
                </View>

                <View>
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
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal for viewing/editing existing event */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.label}>Edit Event</Text>

              {/* Picker for changing event type */}
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={eventName}
                  onValueChange={(value) => setEventName(value)}
                >
                  <Picker.Item label="DnD" value="Dnd" color="#000" />
                  <Picker.Item label="Game Night" value="Game Night" color="#000" />
                  <Picker.Item label="Canceled" value="Canceled" color="#000" />
                  <Picker.Item label="Custom" value="Custom" color="#000" />
                </Picker>
              </View>

              {/* Show custom name input when editing custom event */}
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

              {/* Action buttons with proper spacing */}
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
                      // Update the event and close modal
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

      {/* Modal for selecting month and year to navigate calendar */}
      <Modal visible={monthPickerVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.label}>Select Month and Year</Text>
              
              {/* Month picker */}
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
              
              {/* Year picker */}
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
                  // Format new date and update calendar view
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

// Stylesheet definitions
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