import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import * as Updates from 'expo-updates';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dimensions,
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
import { useUser } from './userContext';

// Get screen dimensions for responsive sizing
const { width, height } = Dimensions.get('window');

// Type definition for event objects with RSVP support
interface Event {
  id: string;
  name: string;
  date: string;
  rsvps?: {
    username: string;
    status: 'Yes' | 'No' | 'Maybe';
  }[];
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
  
  // Get current user from context for RSVP functionality
  const { currentUser, setCurrentUser } = useUser();
  
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

  // Custom hook to manage events (CRUD operations including RSVP)
  const { events, addEvent, deleteEvent, editEvent, addRSVP, removeRSVP } = useEvents();

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

  /**
   * Get the current user's RSVP status for a specific event
   * @param event - The event to check
   * @returns The user's RSVP object or undefined if not found
   */
  const getUserRSVP = (event: Event) => {
    if (!currentUser) return undefined;
    return event.rsvps?.find(r => r.username === currentUser.username);
  };

  /**
   * Handle RSVP button click
   * @param eventId - ID of the event to RSVP to
   * @param status - RSVP status ('Yes', 'No', or 'Maybe')
   */
  const handleRSVP = async (eventId: string, status: 'Yes' | 'No' | 'Maybe') => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to RSVP');
      return;
    }
    await addRSVP(eventId, currentUser.username, status);
  };

  /**
   * Handle logout
   * Clears user context and Remember Me data, then reloads the app
   */
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear Remember Me data
              await AsyncStorage.removeItem('savedUsername');
              await AsyncStorage.removeItem('rememberMe');
              
              // Clear current user
              setCurrentUser(null);
              
              // Reload app to go back to login
              await Updates.reloadAsync();
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Something went wrong while logging out.');
            }
          },
        },
      ]
    );
  };

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
      {/* Logout button in top right corner */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

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
              scrollEnabled={true}
              nestedScrollEnabled={true}
              style={styles.eventFlatList}
              renderItem={({ item }) => {
                // Get user's RSVP status for this event
                const userRSVP = getUserRSVP(item);
                // Count how many people are attending (RSVP'd "Yes")
                const yesCount = item.rsvps?.filter(r => r.status === 'Yes').length || 0;
                const maybeCount = item.rsvps?.filter(r => r.status === 'Maybe').length || 0;
                const noCount = item.rsvps?.filter(r => r.status === 'No').length || 0;
                
                return (
                  <View style={styles.eventCard}>
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
                      <View style={styles.rsvpCountsContainer}>
                        <Text style={styles.rsvpCount}>
                          Yes: {yesCount}
                        </Text>
                        <Text style={styles.rsvpCount}>
                          Maybe: {maybeCount}
                        </Text>
                        <Text style={styles.rsvpCount}>
                          No: {noCount}
                        </Text>
                      </View>
                    </Pressable>
                    
                    {/* RSVP Buttons */}
                    <View style={styles.rsvpButtons}>
                      <TouchableOpacity
                        style={[
                          styles.rsvpButton,
                          userRSVP?.status === 'Yes' && styles.rsvpButtonActive
                        ]}
                        onPress={() => handleRSVP(item.id, 'Yes')}
                      >
                        <Text style={styles.rsvpButtonText}>✓ Yes</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.rsvpButton,
                          userRSVP?.status === 'Maybe' && styles.rsvpButtonMaybe
                        ]}
                        onPress={() => handleRSVP(item.id, 'Maybe')}
                      >
                        <Text style={styles.rsvpButtonText}>? Maybe</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.rsvpButton,
                          userRSVP?.status === 'No' && styles.rsvpButtonNo
                        ]}
                        onPress={() => handleRSVP(item.id, 'No')}
                      >
                        <Text style={styles.rsvpButtonText}>✗ No</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
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

              {/* Show attendee list if there are RSVPs */}
              {selectedEvent && selectedEvent.rsvps && selectedEvent.rsvps.length > 0 && (
                <View style={styles.attendeeSection}>
                  <Text style={styles.label}>RSVPs:</Text>
                  
                  {/* Three columns side by side */}
                  <View style={styles.rsvpColumnsContainer}>
                    {/* Yes Column */}
                    <View style={styles.rsvpColumn}>
                      <Text style={styles.rsvpCategoryTitle}>✓ Yes</Text>
                      {selectedEvent.rsvps
                        ?.filter(rsvp => rsvp.status === 'Yes')
                        .map((rsvp, idx) => (
                          <Text key={idx} style={styles.attendeeName}>
                            {rsvp.username}
                          </Text>
                        ))}
                      {(selectedEvent.rsvps?.filter(r => r.status === 'Yes').length ?? 0) === 0 && (
                        <Text style={styles.emptyColumn}>—</Text>
                      )}
                    </View>
                    
                    {/* Maybe Column */}
                    <View style={styles.rsvpColumn}>
                      <Text style={styles.rsvpCategoryTitle}>? Maybe</Text>
                      {selectedEvent.rsvps
                        ?.filter(rsvp => rsvp.status === 'Maybe')
                        .map((rsvp, idx) => (
                          <Text key={idx} style={styles.attendeeName}>
                            {rsvp.username}
                          </Text>
                        ))}
                      {(selectedEvent.rsvps?.filter(r => r.status === 'Maybe').length ?? 0) === 0 && (
                        <Text style={styles.emptyColumn}>—</Text>
                      )}
                    </View>
                    
                    {/* No Column */}
                    <View style={styles.rsvpColumn}>
                      <Text style={styles.rsvpCategoryTitle}>✗ No</Text>
                      {selectedEvent.rsvps
                        ?.filter(rsvp => rsvp.status === 'No')
                        .map((rsvp, idx) => (
                          <Text key={idx} style={styles.attendeeName}>
                            {rsvp.username}
                          </Text>
                        ))}
                      {(selectedEvent.rsvps?.filter(r => r.status === 'No').length ?? 0) === 0 && (
                        <Text style={styles.emptyColumn}>—</Text>
                      )}
                    </View>
                  </View>
                  
                  {/* Show message if no RSVPs at all */}
                  {(selectedEvent.rsvps?.length ?? 0) === 0 && (
                    <Text style={styles.noAttendees}>No RSVPs yet</Text>
                  )}
                </View>
              )}

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

// Responsive Stylesheet definitions
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'white' 
  },
  logoutContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
  },
  logoutButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarContainer: { 
    flex: 1, 
    paddingTop: 50, 
    paddingHorizontal: 10 
  },
  calendarHeader: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    padding: 10,
    color: '#333',
  },
  footer: { 
    backgroundColor: '#fff' 
  },
  footerInner: { 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    marginBottom: 30 
  },
  label: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginBottom: 5 
  },
  noEvents: { 
    fontStyle: 'italic', 
    color: '#888' 
  },
  eventItem: { 
    fontSize: 15, 
    marginBottom: 4 
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
    maxHeight: '80%', // Responsive: modal won't exceed 80% of screen height
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 15,
  },
  // RSVP-related styles
  eventCard: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  rsvpCountsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 12,
  },
  rsvpCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  rsvpButtons: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  rsvpButton: {
    flex: 1,
    padding: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    alignItems: 'center',
  },
  rsvpButtonActive: {
    backgroundColor: '#4CAF50',
  },
  rsvpButtonMaybe: {
    backgroundColor: '#FFA726',
  },
  rsvpButtonNo: {
    backgroundColor: '#EF5350',
  },
  rsvpButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  eventList: {
    marginTop: 20,
    flex: 1, // Dynamic: takes available space
  },
  eventFlatList: {
    flex: 1, // Dynamic: uses all available space instead of fixed height
  },
  // Attendee section styles
  attendeeSection: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  rsvpColumnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  rsvpColumn: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
  },
  rsvpCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 4,
  },
  attendeeName: {
    fontSize: 12,
    marginVertical: 2,
    textAlign: 'center',
  },
  emptyColumn: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noAttendees: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
});