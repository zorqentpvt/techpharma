package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/types"
)

type UserRepository interface {
	Create(ctx context.Context, user *entity.User) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.User, error) // Changed to uuid.UUID
	GetByPhoneNumber(ctx context.Context, phoneNumber string) (*entity.User, error)
	GetByEmail(ctx context.Context, email string) (*entity.User, error)
	Update(ctx context.Context, user *entity.User) error
	UpdateUser(ctx context.Context, id uuid.UUID, user *entity.User) error
	Delete(ctx context.Context, id uuid.UUID) error // Changed to uuid.UUID
	List(ctx context.Context, limit, offset int) ([]*entity.User, error)
	GetAllRoles(ctx context.Context) ([]*entity.Role, error)
	ListWithFilters(ctx context.Context, filters types.UserListFilters, limit, offset int, sortField, sortOrder string) ([]*entity.User, int64, error)
	GetRoleByID(ctx context.Context, id uuid.UUID) ([]*entity.Role, error)
	DeleteUser(ctx context.Context, id uuid.UUID) error
	CreateDoctor(ctx context.Context, user *entity.Doctor) (*entity.Doctor, error)
	CreatePharmacy(ctx context.Context, pharmacy *entity.Pharmacy) (*entity.Pharmacy, error)
}

type AuditLogRepository interface {
	// Create adds a new audit log entry to the database.
	Create(ctx context.Context, logEntry *entity.AuditLog) error
}
type SecurityEventRepository interface {
	// Create adds a new security event to the database.
	Create(ctx context.Context, securityEvent *entity.SecurityEvent) error
	SendPasswordResetEmail(ctx context.Context, email string, resetoken string) error
}
type MedicineRepository interface {
	GetMedicines(ctx context.Context, searchQuery string) ([]*entity.Medicine, error)
	AddMedicine(ctx context.Context, userId uuid.UUID, medicine *entity.Medicine) (*entity.Medicine, error)
	ListMedicines(ctx context.Context, filters types.MedicineFilters) ([]*entity.Medicine, int64, error)
	GetMedicineByID(ctx context.Context, medicineID uuid.UUID) (*entity.Medicine, error)
	DeleteMedicine(ctx context.Context, medicineID uuid.UUID) error
	UpdateMedicine(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID, updatedMedicine *entity.Medicine) error
}
type DoctorRepository interface {
	GetDoctors(ctx context.Context, searchQuery string) ([]*entity.Doctor, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Doctor, error)
}
type OrderRepository interface {
	//User Cart Managment
	AddToCart(ctx context.Context, cart *entity.Cart) error
	GetCartByUserID(ctx context.Context, userID uuid.UUID) (*entity.Cart, error)
	UpdateCart(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID, quantity int) (*entity.Cart, error)
	GetCartByID(ctx context.Context, cartID uuid.UUID) (*entity.Cart, error)

	RemoveFromCart(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID) error
	CreateOrderFromCart(ctx context.Context, cart *entity.Cart, paymentID uuid.UUID, deliveryAddress string) (*entity.Order, error)
	ClearCart(ctx context.Context, userID uuid.UUID) error
	GetOrderByID(ctx context.Context, orderID uuid.UUID) (*entity.Order, error)
	GetUserOrders(ctx context.Context, userID uuid.UUID, page, limit int) ([]*entity.Order, int64, error)
	UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, status string) error

	GetPharmacyByUserID(ctx context.Context, userID uuid.UUID) (*entity.Pharmacy, error)
	GetTotalRevenue(ctx context.Context, pharmacyID uuid.UUID) (float64, error)
	GetPharmacyOrders(ctx context.Context, pharmacyID uuid.UUID, filter types.ListPharmacyOrders) ([]*entity.Order, int64, error)
}
type PaymentRepository interface {
	Create(ctx context.Context, payment *entity.Payment) error
	GetByOrderID(ctx context.Context, orderID string) (*entity.Payment, error)
	GetByRazorpayOrderID(ctx context.Context, razorpayOrderID string) (*entity.Payment, error)
	UpdateStatus(ctx context.Context, orderID string, status string, razorpayPaymentID, razorpaySignature, paymentMethod, failureReason string) error
	GetUserPayments(ctx context.Context, userID uuid.UUID, page, limit int) ([]*entity.Payment, int64, error)

	//User Order Management

}
type AppoinmentRepository interface {
	BookAppointment(ctx context.Context, appointment *entity.Appointment) (*entity.Appointment, error)
	IsSlotBooked(ctx context.Context, doctorID uuid.UUID, appointmentDate string, appointmentTime string) (bool, error)
	GetDoctorAppointments(ctx context.Context, doctorID uuid.UUID, status entity.AppointmentStatus) ([]*entity.Appointment, error)
	GetUpcomingAppointments(ctx context.Context, doctorID uuid.UUID) ([]*entity.Appointment, error)
	GetAppointmentHistory(ctx context.Context, doctorID uuid.UUID) ([]*entity.Appointment, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Appointment, error)
	Update(ctx context.Context, appointment *entity.Appointment) error
	ScheduleAppointment(ctx context.Context, appointment *entity.Appointment) (*entity.Appointment, error)
	GetAllByDoctorID(ctx context.Context, doctorID uuid.UUID) ([]*entity.Appointment, error)
	GetUpcomingAppointmentsByPatient(ctx context.Context, patientID uuid.UUID) ([]*entity.Appointment, error)
	GetAppointmentHistoryByPatient(ctx context.Context, patientID uuid.UUID) ([]*entity.Appointment, error)
	DeletePendingSlots(ctx context.Context, appointmentID uuid.UUID) error
	GetConfirmedAppionmentSlot(ctx context.Context, req *types.ConfirmedSlotRequest) ([]types.ConfirmedSlotResponse, error)
	CancelBookedSlot(ctx context.Context, slotID uuid.UUID, reason string) error
}
