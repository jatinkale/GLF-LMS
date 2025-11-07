# Special Actions - Frontend Testing Checklist

## Test Date: November 7, 2025
## Backend API Status: ✅ All tests passed

---

## Single User Update Tab

### Search and Selection
- [ ] Employee search autocomplete displays all employees
- [ ] Searching by name filters correctly
- [ ] Searching by employee ID filters correctly
- [ ] Selecting an employee displays all 6 details:
  - [ ] Employee ID
  - [ ] Name
  - [ ] Gender
  - [ ] Location
  - [ ] Manager Name
  - [ ] Manager ID

### Leave Processing Form
- [ ] Leave Type dropdown displays all 8 leave types
- [ ] Action dropdown has "Add Leaves" and "Remove Leaves" options
- [ ] Number of Leaves accepts positive numbers only
- [ ] Comments field is mandatory
- [ ] Process button is disabled when form is incomplete

### Gender/Location Warnings
- [ ] Warning appears when ML is selected for non-female employee
- [ ] Warning appears when PTL is selected for non-male employee
- [ ] Warning is shown in confirmation dialog
- [ ] Can proceed despite warning

### Add Leaves Operation
- [ ] Confirmation dialog shows all details correctly
- [ ] Warning messages display if applicable
- [ ] Success toast appears after processing
- [ ] Leave balances refresh automatically
- [ ] History section updates with new entry

### Remove Leaves Operation
- [ ] Confirmation dialog shows all details correctly
- [ ] Error message if insufficient balance
- [ ] Success toast appears after processing
- [ ] Leave balances refresh automatically
- [ ] History section shows negative value for removal

---

## Bulk Update Tab

### Filter Section
- [ ] Employee IDs field accepts comma-separated values
- [ ] Location dropdown shows: All, India, United States
- [ ] Employment Type dropdown shows: All, FTE, FTDC, CONSULTANT
- [ ] Gender dropdown shows: All, M, F
- [ ] Date of Joining From field accepts date input
- [ ] Date of Joining To field accepts date input
- [ ] Search button triggers employee search

### Employee Grid
- [ ] Grid displays after search with correct columns:
  - [ ] Checkbox column
  - [ ] Employee ID
  - [ ] Name
  - [ ] Gender
  - [ ] Location
  - [ ] Employment Type
  - [ ] Designation
- [ ] "Select All" checkbox works correctly
- [ ] Individual checkboxes work correctly
- [ ] Selected count updates correctly
- [ ] Grid shows "No employees found" when filters return no results

### Bulk Processing Form
- [ ] Form appears below grid when employees are selected
- [ ] Shows correct count of selected employees
- [ ] Leave Type dropdown displays all leave types
- [ ] Action dropdown has "Add Leaves" and "Remove Leaves" options
- [ ] Number of Leaves field accepts positive numbers
- [ ] Comments field is mandatory
- [ ] Process button disabled when form incomplete or no employees selected

### Gender Warnings for Bulk
- [ ] Warning appears when ML is selected and non-female employees are in selection
- [ ] Warning appears when PTL is selected and non-male employees are in selection
- [ ] Warning lists specific employee names
- [ ] Warning shown in confirmation dialog

### Bulk Add Operation
- [ ] Confirmation dialog shows:
  - [ ] Number of selected employees
  - [ ] Leave type and amount
  - [ ] Action type (Add)
  - [ ] Comments
  - [ ] Warning messages if applicable
- [ ] Success toast shows after processing
- [ ] Results dialog displays:
  - [ ] Number of processed employees
  - [ ] Number of errors
  - [ ] Number of warnings
  - [ ] List of successfully processed employees
  - [ ] List of error messages (if any)
- [ ] Leave balances refresh for all affected employees
- [ ] History updates with all entries

### Bulk Remove Operation
- [ ] Confirmation dialog shows all details
- [ ] Results dialog shows:
  - [ ] Successfully processed employees
  - [ ] Errors for employees with insufficient balance
- [ ] Leave balances update correctly
- [ ] History shows negative values for removals

---

## Filter Combinations Testing

### By Employee IDs
- [ ] Single employee ID: "Z1200"
- [ ] Multiple IDs: "Z1200, Z1001, Z1269"
- [ ] Non-existent ID shows empty grid

### By Location
- [ ] Location = "India" returns only IND employees
- [ ] Location = "United States" returns only US employees
- [ ] Location = "All" returns all employees

### By Employment Type
- [ ] Employment Type = "FTE" returns only FTE employees
- [ ] Employment Type = "FTDC" returns only FTDC employees
- [ ] Employment Type = "CONSULTANT" returns only consultants

### By Gender
- [ ] Gender = "M" returns only male employees
- [ ] Gender = "F" returns only female employees

### By Date Range
- [ ] From date only: returns employees joined after that date
- [ ] To date only: returns employees joined before that date
- [ ] Both dates: returns employees in range

### Combined Filters
- [ ] Location + Gender: Male employees in India
- [ ] Location + Employment Type: FTE employees in US
- [ ] Gender + Date Range: Female employees joined in 2024
- [ ] All filters combined

---

## UI/UX Verification

### Layout
- [ ] Special Actions section appears below Leave Allocation section
- [ ] Tabs switch correctly between Single User and Bulk Update
- [ ] All fields are properly aligned
- [ ] Responsive design works on different screen sizes

### Styling
- [ ] Color scheme matches existing application
- [ ] Buttons use correct colors (primary blue for process)
- [ ] Warning alerts use orange/yellow color
- [ ] Success toasts use green color
- [ ] Error toasts use red color

### Loading States
- [ ] Loading indicator shows during employee search
- [ ] Loading indicator shows during leave processing
- [ ] Buttons show "Processing..." text when loading
- [ ] All buttons are disabled during processing

### Error Handling
- [ ] Network errors show appropriate toast messages
- [ ] Validation errors highlight fields in red
- [ ] API errors display user-friendly messages
- [ ] Empty states show helpful messages

---

## Integration Testing

### With Leave Allocation Section
- [ ] Can switch between Leave Allocation and Special Actions
- [ ] Both sections work independently
- [ ] History updates from both sections

### With Leave Balances
- [ ] Dashboard balance cards update after special actions
- [ ] Employee Details page shows updated balances
- [ ] Balance calculations are correct (allocated, used, available)

### With History
- [ ] History entries show correct action (ADD/REMOVE)
- [ ] Positive values for ADD, negative for REMOVE
- [ ] Comments display correctly
- [ ] Timestamp is accurate
- [ ] User who performed action is recorded

---

## Edge Cases

### Single User
- [ ] Adding leaves to employee with no balance creates new record
- [ ] Removing more leaves than available shows error
- [ ] Removing leaves from employee with no balance shows error
- [ ] Comments with special characters work correctly
- [ ] Very large number of leaves (e.g., 999) is handled

### Bulk
- [ ] Selecting all employees and processing works
- [ ] Mixed success/error results display correctly
- [ ] Removing leaves from multiple employees with varying balances
- [ ] Processing large number of employees (10+)
- [ ] Deselecting employees updates count correctly

---

## Performance

- [ ] Employee search returns results quickly (< 1 second)
- [ ] Bulk operations complete within reasonable time
- [ ] No UI freezing during processing
- [ ] Toast notifications don't stack excessively

---

## Accessibility

- [ ] All form fields have proper labels
- [ ] Tab navigation works correctly
- [ ] Error messages are announced
- [ ] Success messages are announced
- [ ] Keyboard shortcuts work (Enter to submit, Esc to cancel)

---

## Browser Compatibility

- [ ] Chrome/Edge (already tested)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

---

## Test Results Summary

**Backend API Tests:** ✅ All Passed (10/10)

**Frontend Tests:** To be completed manually

**Issues Found:** None yet

**Date Completed:** _________________

**Tester:** _________________
