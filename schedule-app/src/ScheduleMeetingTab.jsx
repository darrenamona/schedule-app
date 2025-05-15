// src/ScheduleMeetingTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import { Modal, Button, Form } from 'react-bootstrap';
import { db, auth } from './firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs
} from 'firebase/firestore';

function ScheduleMeetingTab() {
  const [events, setEvents] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [inviteeIds, setInviteeIds] = useState([]);
  const [rsvpResponse, setRsvpResponse] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('');
  const calendarRef = useRef();
  const currentUser = auth.currentUser;

  // Load friends
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users', currentUser.uid, 'friends'),
      (snap) => {
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().nickname || doc.data().friendName || 'Unnamed'
        }));
        setFriends(data);
      }
    );
    return () => unsub();
  }, [currentUser.uid]);

  // Load events (own + selected friends')
  useEffect(() => {
    const friendIds = selectedFriends;
    const allIds = [currentUser.uid, ...friendIds];

    const q = query(collection(db, 'events'), where('attendeeIds', 'array-contains-any', allIds));
    const unsub = onSnapshot(q, (snap) => {
      const result = [];
      snap.forEach((docSnap) => {
        const ev = docSnap.data();
        const myStatus = ev.attendees?.[currentUser.uid] || 'Pending';
        if (ev.attendeeIds.includes(currentUser.uid) || friendIds.some(id => ev.attendeeIds.includes(id))) {
          result.push({
            id: docSnap.id,
            title: ev.attendeeIds.includes(currentUser.uid) ? ev.title : 'Busy',
            start: ev.start.toDate(),
            end: ev.end.toDate(),
            description: ev.description || '',
            location: ev.location || '',
            link: ev.link || '',
            priority: ev.priority || 'Medium',
            organizerId: ev.organizerId,
            organizerName: ev.organizerName,
            attendees: ev.attendees || {},
            attendeeIds: ev.attendeeIds,
            myStatus,
            isFriendEvent: !ev.attendeeIds.includes(currentUser.uid)
          });
        }
      });
      setEvents(result);
    });

    return () => unsub();
  }, [selectedFriends, currentUser.uid]);

  const handleSelectFriend = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleDateSelect = (selectInfo) => {
    setCurrentEvent({
      title: '',
      start: selectInfo.start,
      end: selectInfo.end,
      description: '',
      location: '',
      link: '',
      priority: 'Medium'
    });
    setInviteeIds([]);
    setModalMode('new');
    setShowModal(true);
  };

  const handleEventClick = ({ event }) => {
    const ext = event.extendedProps;
    if (ext.isFriendEvent) return;

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
      myStatus: ext.myStatus
    });

    if (ext.organizerId === currentUser.uid) {
      setInviteeIds(ext.attendeeIds.filter((id) => id !== currentUser.uid));
    } else {
      setInviteeIds([]);
      setRsvpResponse(ext.myStatus === 'Pending' ? '' : ext.myStatus);
    }

    setModalMode('edit');
    setShowModal(true);
  };

  const handleInviteSelect = (e) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setInviteeIds(selected);
  };

  const handleSave = async () => {
    if (!currentEvent) return;
    try {
      if (modalMode === 'new') {
        const attendeesMap = {};
        const attendeeList = [currentUser.uid];
        attendeesMap[currentUser.uid] = 'Yes';
        inviteeIds.forEach((id) => {
          attendeesMap[id] = 'Pending';
          attendeeList.push(id);
        });

        await addDoc(collection(db, 'events'), {
          title: currentEvent.title || '(No Title)',
          start: currentEvent.start,
          end: currentEvent.end,
          description: currentEvent.description,
          location: currentEvent.location,
          link: currentEvent.link,
          priority: currentEvent.priority,
          organizerId: currentUser.uid,
          organizerName: currentUser.displayName || currentUser.email,
          attendees: attendeesMap,
          attendeeIds: attendeeList
        });
      } else if (modalMode === 'edit') {
        if (currentEvent.organizerId === currentUser.uid) {
          const attendeesMap = {};
          const attendeeList = [currentUser.uid];
          attendeesMap[currentUser.uid] = 'Yes';
          inviteeIds.forEach((id) => {
            attendeesMap[id] = 'Pending';
            attendeeList.push(id);
          });

          await updateDoc(doc(db, 'events', currentEvent.id), {
            title: currentEvent.title,
            start: currentEvent.start,
            end: currentEvent.end,
            description: currentEvent.description,
            location: currentEvent.location,
            link: currentEvent.link,
            priority: currentEvent.priority,
            attendees: attendeesMap,
            attendeeIds: attendeeList
          });
        } else {
          await updateDoc(doc(db, 'events', currentEvent.id), {
            [`attendees.${currentUser.uid}`]: rsvpResponse
          });
        }
      }
    } catch (err) {
      console.error("Save failed:", err);
    }
    setShowModal(false);
    setCurrentEvent(null);
    setInviteeIds([]);
    setRsvpResponse('');
    setModalMode('');
  };

  const handleDelete = async () => {
    if (modalMode === 'edit' && currentEvent.organizerId === currentUser.uid) {
      if (window.confirm("Delete this meeting for everyone?")) {
        await deleteDoc(doc(db, 'events', currentEvent.id));
        setShowModal(false);
      }
    }
  };

  const eventClassNames = ({ event }) => {
    const ext = event.extendedProps;
    const classes = [];
    if (ext.isFriendEvent) return ['friend-busy'];
    if (ext.priority === 'High') classes.push('priority-high');
    if (ext.priority === 'Medium') classes.push('priority-medium');
    if (ext.priority === 'Low') classes.push('priority-low');
    if (ext.myStatus === 'Pending') classes.push('pending-event');
    return classes;
  };

  return (
    <div className="container mt-4">
      <h3>Schedule Meeting</h3>
      <Form className="my-3">
        <Form.Label>Select friends to include in availability:</Form.Label>
        {friends.map((friend) => (
          <Form.Check
            key={friend.id}
            type="checkbox"
            id={`friend-${friend.id}`}
            label={friend.name}
            checked={selectedFriends.includes(friend.id)}
            onChange={() => handleSelectFriend(friend.id)}
          />
        ))}
      </Form>

      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin, bootstrap5Plugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay'
        }}
        selectable={true}
        events={events}
        eventClick={handleEventClick}
        select={handleDateSelect}
        eventClassNames={eventClassNames}
        height="auto"
      />

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === 'new' ? 'Schedule Meeting' : 'Meeting Details'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentEvent && (
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  value={currentEvent.title}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, title: e.target.value })}
                  disabled={modalMode === 'edit' && currentEvent.organizerId !== currentUser.uid}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Start</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={formatDateTimeLocal(currentEvent.start)}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, start: new Date(e.target.value) })}
                  disabled={modalMode === 'edit' && currentEvent.organizerId !== currentUser.uid}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>End</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={formatDateTimeLocal(currentEvent.end)}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, end: new Date(e.target.value) })}
                  disabled={modalMode === 'edit' && currentEvent.organizerId !== currentUser.uid}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Priority</Form.Label>
                <Form.Select
                  value={currentEvent.priority}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, priority: e.target.value })}
                  disabled={modalMode === 'edit' && currentEvent.organizerId !== currentUser.uid}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  value={currentEvent.description}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, description: e.target.value })}
                  disabled={modalMode === 'edit' && currentEvent.organizerId !== currentUser.uid}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  value={currentEvent.location}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, location: e.target.value })}
                  disabled={modalMode === 'edit' && currentEvent.organizerId !== currentUser.uid}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Link</Form.Label>
                <Form.Control
                  type="text"
                  value={currentEvent.link}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, link: e.target.value })}
                  disabled={modalMode === 'edit' && currentEvent.organizerId !== currentUser.uid}
                />
              </Form.Group>
              {modalMode === 'edit' && currentEvent.organizerId !== currentUser.uid && (
                <Form.Group>
                  <Form.Label>Your RSVP</Form.Label>
                  <Form.Select
                    value={rsvpResponse}
                    onChange={(e) => setRsvpResponse(e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    <option value="Yes">✅ Yes</option>
                    <option value="No">❌ No</option>
                  </Form.Select>
                </Form.Group>
              )}
              {modalMode === 'edit' && (
                <div className="mt-2">
                  <p><strong>Attendees:</strong></p>
                  <ul>
                    {Object.entries(currentEvent.attendees || {}).map(([uid, status]) => (
                      <li key={uid}>
                        {status === 'Yes' ? '✅' : status === 'No' ? '❌' : '❓'} {uid}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {currentUser.uid === currentEvent.organizerId && (
                <Form.Group className="mt-2">
                  <Form.Label>Invite Friends</Form.Label>
                  <Form.Select multiple value={inviteeIds} onChange={handleInviteSelect}>
                    {friends.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          {modalMode === 'edit' && currentEvent.organizerId === currentUser.uid && (
            <Button variant="danger" onClick={handleDelete}>
              Cancel Meeting
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function formatDateTimeLocal(date) {
  if (!date) return '';
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default ScheduleMeetingTab;
