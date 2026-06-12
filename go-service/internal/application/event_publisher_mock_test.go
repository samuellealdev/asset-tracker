package application_test

import (
	"context"
	"sync"
	"time"
)

// publishCall captures the arguments of a single EventPublisher call.
type publishCall struct {
	DeviceID   string
	DeviceName string
	Timestamp  time.Time
}

// mockEventPublisher records EventPublisher calls for test assertions.
// Return an error by setting returnErr before calling the publish methods.
// Set wg.Add(n) before calling a use case that is expected to publish,
// then call wg.Wait() after the use case returns to synchronize with the
// async goroutine.
type mockEventPublisher struct {
	mu           sync.Mutex
	returnErr    error
	createdCalls []publishCall
	updatedCalls []publishCall
	deletedCalls []publishCall
	wg           sync.WaitGroup
}

func (m *mockEventPublisher) PublishDeviceCreated(_ context.Context, deviceID, deviceName string, timestamp time.Time) error {
	m.mu.Lock()
	m.createdCalls = append(m.createdCalls, publishCall{DeviceID: deviceID, DeviceName: deviceName, Timestamp: timestamp})
	m.mu.Unlock()
	m.wg.Done()
	return m.returnErr
}

func (m *mockEventPublisher) PublishDeviceUpdated(_ context.Context, deviceID, deviceName string, timestamp time.Time) error {
	m.mu.Lock()
	m.updatedCalls = append(m.updatedCalls, publishCall{DeviceID: deviceID, DeviceName: deviceName, Timestamp: timestamp})
	m.mu.Unlock()
	m.wg.Done()
	return m.returnErr
}

func (m *mockEventPublisher) PublishDeviceDeleted(_ context.Context, deviceID, deviceName string, timestamp time.Time) error {
	m.mu.Lock()
	m.deletedCalls = append(m.deletedCalls, publishCall{DeviceID: deviceID, DeviceName: deviceName, Timestamp: timestamp})
	m.mu.Unlock()
	m.wg.Done()
	return m.returnErr
}

// CreatedCallCount returns how many times PublishDeviceCreated was called.
func (m *mockEventPublisher) CreatedCallCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.createdCalls)
}

// UpdatedCallCount returns how many times PublishDeviceUpdated was called.
func (m *mockEventPublisher) UpdatedCallCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.updatedCalls)
}

// DeletedCallCount returns how many times PublishDeviceDeleted was called.
func (m *mockEventPublisher) DeletedCallCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.deletedCalls)
}

// LastCreatedCall returns the arguments from the most recent PublishDeviceCreated call.
func (m *mockEventPublisher) LastCreatedCall() (deviceID, deviceName string, timestamp time.Time, ok bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if len(m.createdCalls) == 0 {
		return "", "", time.Time{}, false
	}
	c := m.createdCalls[len(m.createdCalls)-1]
	return c.DeviceID, c.DeviceName, c.Timestamp, true
}

// LastUpdatedCall returns the arguments from the most recent PublishDeviceUpdated call.
func (m *mockEventPublisher) LastUpdatedCall() (deviceID, deviceName string, timestamp time.Time, ok bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if len(m.updatedCalls) == 0 {
		return "", "", time.Time{}, false
	}
	c := m.updatedCalls[len(m.updatedCalls)-1]
	return c.DeviceID, c.DeviceName, c.Timestamp, true
}

// LastDeletedCall returns the arguments from the most recent PublishDeviceDeleted call.
func (m *mockEventPublisher) LastDeletedCall() (deviceID, deviceName string, timestamp time.Time, ok bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if len(m.deletedCalls) == 0 {
		return "", "", time.Time{}, false
	}
	c := m.deletedCalls[len(m.deletedCalls)-1]
	return c.DeviceID, c.DeviceName, c.Timestamp, true
}

// TotalCalls returns the total number of publish calls across all event types.
func (m *mockEventPublisher) TotalCalls() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.createdCalls) + len(m.updatedCalls) + len(m.deletedCalls)
}
