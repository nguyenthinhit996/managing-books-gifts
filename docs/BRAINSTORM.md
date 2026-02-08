# Project Brainstorm & Requirements

## Date: February 8, 2026

### Context
- Your wife works at an English learning center (branch of a reputation brand)
- Current pain point: Managing book lending/borrowing for students
- Goal: Create a system to streamline book distribution and tracking

### Ideas & Requirements to Discuss

#### Dashboard Features (Priority: High)
- [ ] Real-time book inventory count
- [ ] Search and filter books by level, ISBN (International Standard Book Number), title
- [ ] Lending history with student names
- [ ] Due date tracking with visual warnings
- [ ] Ability to mark books as returned/damaged/lost
- [ ] Student borrowing history
- [ ] Export reports (Excel/PDF)

#### Enrollment Form Features (Priority: High)
- [ ] Student name, contact, email
- [ ] Student level (Beginner, Elementary, Pre-Intermediate, etc.)
- [ ] Type of student (New, Trial, Returning)
- [ ] Which sales staff is handling the transaction
- [ ] Book selection and assignment
- [ ] Optional: Photo ID / Document upload

#### Business Logic
- [ ] Can a student borrow multiple books?
- [ ] What's the max borrowing duration per book?
- [ ] Are there different rules for new vs. returning students?
- [ ] What happens with lost/damaged books?
- [ ] Should there be an overdue notification system?
- [ ] Refund/replacement policy?

#### User Access & Security
- [ ] Different permission levels (Manager, Sales, Admin)?
- [ ] Should sales only see the enrollment form?
- [ ] Can managers modify student information?
- [ ] Do we need to track who performed each action?

#### Mobile/Responsiveness
- [ ] Does the form need to work on phones/tablets?
- [ ] Should the dashboard work on mobile?
- [ ] Barcode scanning for books?

#### Additional Features (Future)
- [ ] Email notifications for overdue books
- [ ] SMS reminders
- [ ] Student portal to view their borrowed books
- [ ] Book statistics and popular titles
- [ ] Inventory warnings (low stock alerts)
- [ ] Integration with student enrollment system

### Questions to Answer
1. How many students per month?
2. How many books total in inventory?
3. Average borrowing duration?
4. Multiple borrowing periods per student?
5. Need for international student support (multiple languages)?

### Notes
- Keep it simple and intuitive for non-tech users
- Sales staff need quick, easy form submission
- Manager needs clear, actionable dashboard
- Focus on quick wins first, then expand features
