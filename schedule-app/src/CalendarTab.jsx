import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import { Modal, Button, Form } from 'react-bootstrap';
import { db, auth } from './firebase';
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';

function CalendarTab() {
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [rsvpResponse, setRsvpResponse] = useState('');
  const calendarRef = useRef();

  const currentUser = auth.currentUser;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'events'), (snapshot) => {
      const eventData = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const myStatus = data.attendees?.[currentUser.uid] || 'Pending';
        const isCreator = data.organizerId === currentUser.uid;

        if (isCreator || myStatus !== 'No') {
          eventData.push({
            id: docSnap.id,
            title: data.title,
            start: data.start.toDate(),
            end: data.end.toDate(),
            description: data.description || '',
            location: data.location || '',
            link: data.link || '',
            priority: data.priority || 'Medium',
            organizerId: data.organizerId,
            organizerName: data.organizerName,
            attendees: data.attendees || {},
            attendeeIds: data.attendeeIds || [],
            myStatus,
            isCreator,
          });
        }
      });
      setEvents(eventData);
    });
    return () => unsubscribe();
  }, [currentUser.uid]);

  const handleEventClick = ({ event }) => {
    const ext = event.extendedProps;
    setCurrentEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      description: ext.description,
      location: ext.location,
      link: ext.link,
      priority: ext.priority,
      organizerId: ext.organizerId,
      organizerName: ext.organizerName,
      attendees: ext.attendees,
      attendeeIds: ext.attendeeIds,
      myStatus: ext.myStatus,
      isCreator: ext.isCreator,
    });
    setRsvpResponse(ext.myStatus === 'Pending' ? '' : ext.myStatus);
    setShowEventModal(true);
  };

  const handleRSVP = async () => {
    const docRef = doc(db, 'events', currentEvent.id);
    await updateDoc(docRef, {
      [`attendees.${currentUser.uid}`]: rsvpResponse || 'Pending',
    });
    setShowEventModal(false);
  };

  const handleDeleteEvent = async () => {
    await deleteDoc(doc(db, 'events', currentEvent.id));
    setShowEventModal(false);
  };

  const eventClassNames = (arg) => {
    const ext = arg.event.extendedProps;
    const classes = [];
    if (ext.priority === 'High') classes.push('priority-high');
    if (ext.priority === 'Medium') classes.push('priority-medium');
    if (ext.priority === 'Low') classes.push('priority-low');
    if (ext.myStatus === 'Pending') classes.push('pending-event');
    return classes;
  };

  return (
    <div className="container mt-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, bootstrap5Plugin]}
        ref={calendarRef}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        height="auto"
        selectable={false}
        events={events}
        eventClick={handleEventClick}
        eventClassNames={eventClassNames}
      />

      <Modal show={showEventModal} onHide={() => setShowEventModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Event Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentEvent && (
            <Form>
              <p><strong>Title:</strong> {currentEvent.title}</p>
              <p><strong>Start:</strong> {currentEvent.start.toLocaleString()}</p>
              <p><strong>End:</strong> {currentEvent.end.toLocaleString()}</p>
              <p><strong>Description:</strong> {currentEvent.description}</p>
              <p><strong>Location:</strong> {currentEvent.location}</p>
              <p><strong>Link:</strong> <a href={currentEvent.link}>{currentEvent.link}</a></p>
              <p><strong>Organizer:</strong> {currentEvent.organizerName}</p>
              <p><strong>Priority:</strong> {currentEvent.priority}</p>

              {!currentEvent.isCreator && (
                <Form.Group>
                  <Form.Label>Your RSVP</Form.Label>
                  <Form.Select value={rsvpResponse} onChange={(e) => setRsvpResponse(e.target.value)}>
                    {rsvpResponse === '' && <option value="">-- Select Response --</option>}
                    <option value="Yes">✅ Yes</option>
                    <option value="No">❌ No</option>
                  </Form.Select>
                </Form.Group>
              )}

              <p className="mt-3"><strong>Attendees:</strong></p>
              <ul>
                {Object.entries(currentEvent.attendees).map(([uid, status]) => (
                  <li key={uid}>
                    {status === 'Yes' ? '✅' : status === 'No' ? '❌' : '❓'} {uid}
                  </li>
                ))}
              </ul>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!currentEvent?.isCreator && (
            <Button variant="primary" onClick={handleRSVP} disabled={!rsvpResponse}>
              Save RSVP
            </Button>
          )}
          {currentEvent?.isCreator && (
            <Button variant="danger" onClick={handleDeleteEvent}>Delete Event</Button>
          )}
          <Button variant="secondary" onClick={() => setShowEventModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default CalendarTab;
