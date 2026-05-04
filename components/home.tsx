import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { useUser } from '../context/userContext';
import { useEvents } from '../useEvents';
import CustomPicker from './customPicker';

const { width, height } = Dimensions.get('window');

interface Event {
  id: string;
  name: string;
  date: string;
  rsvps?: {
    username: string;
    status: 'Yes' | 'No' | 'Maybe';
  }[];
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 21 }, (_, i) => `${currentYear - 10 + i}`);

export default function Home() {
  const insets = useSafeAreaInsets();
  const { currentUser, setCurrentUser } = useUser();
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

  const { events, addEvent, deleteEvent, editEvent, addRSVP, removeRSVP } = useEvents();

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

  const getUserRSVP = (event: Event) => {
    if (!currentUser) return undefined;
    return event.rsvps?.find(r => r.username === currentUser.username);
  };

  const handleRSVP = async (eventId: string, status: 'Yes' | 'No' | 'Maybe') => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to RSVP');
      return;
    }
    await addRSVP(eventId, currentUser.username, status);
  };

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
              await AsyncStorage.removeItem('savedUsername');
              await AsyncStorage.removeItem('rememberMe');
              setCurrentUser(null);
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

  const getColorForEventName = (name: string) => {
    switch (name) {
      case 'Dnd': return '#90ee90';
      case 'Game Night': return '#FFD700';
      case 'To Be Determined': return '#4A90D9';
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
    const success = await addEvent(finalName, selectedDate)
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
      if (['Dnd', 'Game Night', 'To Be Determined', 'Canceled'].includes(name)) {
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
      <View style={styles.logoutContainer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

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
              scrollEnabled={true}
              nestedScrollEnabled={true}
              style={styles.eventFlatList}
              renderItem={({ item }) => {
                const userRSVP = getUserRSVP(item);
                const yesCount = item.rsvps?.filter(r => r.status === 'Yes').length || 0;
                const maybeCount = item.rsvps?.filter(r => r.status === 'Maybe').length || 0;
                const noCount = item.rsvps?.filter(r => r.status === 'No').length || 0;
                return (
                  <View style={styles.eventCard}>
                    <Pressable
                      onPress={() => {
                        setSelectedEvent(item);
                        setDetailModalVisible(true);
                        setEventName(['Dnd', 'Game Night', 'To Be Determined', 'Canceled'].includes(item.name) ? item.name : 'Custom');
                        setEditedName(['Dnd', 'Game Night', 'To Be Determined', 'Canceled'].includes(item.name) ? '' : item.name);
                      }}
                    >
                      <Text style={styles.eventItem}>• {item.name}</Text>
                      <View style={styles.rsvpCountsContainer}>
                        <Text style={styles.rsvpCount}>Yes: {yesCount}</Text>
                        <Text style={styles.rsvpCount}>Maybe: {maybeCount}</Text>
                        <Text style={styles.rsvpCount}>No: {noCount}</Text>
                      </View>
                    </Pressable>
                    <View style={styles.rsvpButtons}>
                      <TouchableOpacity
                        style={[styles.rsvpButton, userRSVP?.status === 'Yes' && styles.rsvpButtonActive]}
                        onPress={() => handleRSVP(item.id, 'Yes')}
                      >
                        <Text style={styles.rsvpButtonText}>✓ Yes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.rsvpButton, userRSVP?.status === 'Maybe' && styles.rsvpButtonMaybe]}
                        onPress={() => handleRSVP(item.id, 'Maybe')}
                      >
                        <Text style={styles.rsvpButtonText}>? Maybe</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.rsvpButton, userRSVP?.status === 'No' && styles.rsvpButtonNo]}
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

      <Modal visible={createModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.label}>Select Event Type</Text>
              <CustomPicker
                selectedValue={eventName}
                onValueChange={(value) => setEventName(value)}
                placeholder="Select an event..."
                options={[
                  { label: 'DnD', value: 'Dnd' },
                  { label: 'Game Night', value: 'Game Night' },
                  {label: 'To Be Determined', value: 'To Be Determined'},
                  { label: 'Canceled', value: 'Canceled' },
                  { label: 'Custom', value: 'Custom' },
                ]}
              />
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
              <View style={{ marginTop: 20 }}>
                <View style={{ marginBottom: 10 }}>
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

      <Modal visible={detailModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.label}>Edit Event</Text>
              {selectedEvent && selectedEvent.rsvps && selectedEvent.rsvps.length > 0 && (
                <View style={styles.attendeeSection}>
                  <Text style={styles.label}>RSVPs:</Text>
                  <View style={styles.rsvpColumnsContainer}>
                    <View style={styles.rsvpColumn}>
                      <Text style={styles.rsvpCategoryTitle}>✓ Yes</Text>
                      {selectedEvent.rsvps?.filter(rsvp => rsvp.status === 'Yes').map((rsvp, idx) => (
                        <Text key={idx} style={styles.attendeeName}>{rsvp.username}</Text>
                      ))}
                      {(selectedEvent.rsvps?.filter(r => r.status === 'Yes').length ?? 0) === 0 && (
                        <Text style={styles.emptyColumn}>—</Text>
                      )}
                    </View>
                    <View style={styles.rsvpColumn}>
                      <Text style={styles.rsvpCategoryTitle}>? Maybe</Text>
                      {selectedEvent.rsvps?.filter(rsvp => rsvp.status === 'Maybe').map((rsvp, idx) => (
                        <Text key={idx} style={styles.attendeeName}>{rsvp.username}</Text>
                      ))}
                      {(selectedEvent.rsvps?.filter(r => r.status === 'Maybe').length ?? 0) === 0 && (
                        <Text style={styles.emptyColumn}>—</Text>
                      )}
                    </View>
                    <View style={styles.rsvpColumn}>
                      <Text style={styles.rsvpCategoryTitle}>✗ No</Text>
                      {selectedEvent.rsvps?.filter(rsvp => rsvp.status === 'No').map((rsvp, idx) => (
                        <Text key={idx} style={styles.attendeeName}>{rsvp.username}</Text>
                      ))}
                      {(selectedEvent.rsvps?.filter(r => r.status === 'No').length ?? 0) === 0 && (
                        <Text style={styles.emptyColumn}>—</Text>
                      )}
                    </View>
                  </View>
                  {(selectedEvent.rsvps?.length ?? 0) === 0 && (
                    <Text style={styles.noAttendees}>No RSVPs yet</Text>
                  )}
                </View>
              )}
              <CustomPicker
                selectedValue={eventName}
                onValueChange={(value) => setEventName(value)}
                options={[
                  { label: 'DnD', value: 'Dnd' },
                  { label: 'Game Night', value: 'Game Night' },
                  {label: 'To Be Determined', value: 'To Be Determined'},
                  { label: 'Canceled', value: 'Canceled' },
                  { label: 'Custom', value: 'Custom' },
                ]}
              />
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

      <Modal visible={monthPickerVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.label}>Select Month and Year</Text>
              <CustomPicker
                selectedValue={calendarMonth.toString()}
                onValueChange={(value) => setCalendarMonth(Number(value))}
                options={monthNames.map((month, idx) => ({ label: month, value: idx.toString() }))}
              />
              <CustomPicker
                selectedValue={calendarYear.toString()}
                onValueChange={(value) => setCalendarYear(Number(value))}
                options={yearOptions.map((year) => ({ label: year, value: year }))}
              />
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
    backgroundColor: 'rgba(0,0,0,0)',
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
    backgroundColor:'#fff',
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