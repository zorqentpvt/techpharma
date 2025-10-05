package shared

// tygo:emit
type UserRoleName string

const (
	UserRoleAdmin       UserRoleName = "admin"
	UserRoleDriver      UserRoleName = "driver"
	UserRoleOfficeStaff UserRoleName = "office_staff"
	UserRoleSuperAdmin  UserRoleName = "super_admin"
	UserRoleManager     UserRoleName = "manager"
	UserRoleAccountant  UserRoleName = "accountant"
	UserRoleCustomer    UserRoleName = "customer"
	UserRoleVendor      UserRoleName = "vendor"
)

// tygo:emit
type BusinessType string

const (
	BusinessTypeTransport BusinessType = "transport"
	BusinessTypeLogistics BusinessType = "logistics"
	BusinessTypeTourism   BusinessType = "tourism"
	BusinessTypeRental    BusinessType = "rental"
	BusinessTypeDelivery  BusinessType = "delivery"
	BusinessTypeOther     BusinessType = "other"
)

// tygo:emit
type VehicleType string

const (
	VehicleTypeCar        VehicleType = "car"
	VehicleTypeBus        VehicleType = "bus"
	VehicleTypeTruck      VehicleType = "truck"
	VehicleTypeVan        VehicleType = "van"
	VehicleTypeMotorcycle VehicleType = "motorcycle"
	VehicleTypeOther      VehicleType = "other"
)

// tygo:emit
type TripStatus string

const (
	TripStatusBooked     TripStatus = "booked"
	TripStatusConfirmed  TripStatus = "confirmed"
	TripStatusStarted    TripStatus = "started"
	TripStatusInProgress TripStatus = "in_progress"
	TripStatusCompleted  TripStatus = "completed"
	TripStatusCancelled  TripStatus = "cancelled"
	TripStatusOnHold     TripStatus = "on_hold"
)

// tygo:emit
type PaymentStatus string

const (
	PaymentStatusPending  PaymentStatus = "pending"
	PaymentStatusPaid     PaymentStatus = "paid"
	PaymentStatusPartial  PaymentStatus = "partial"
	PaymentStatusOverdue  PaymentStatus = "overdue"
	PaymentStatusFailed   PaymentStatus = "failed"
	PaymentStatusRefunded PaymentStatus = "refunded"
)

// tygo:emit
type PaymentMethod string

const (
	PaymentMethodCash         PaymentMethod = "cash"
	PaymentMethodCard         PaymentMethod = "card"
	PaymentMethodUPI          PaymentMethod = "upi"
	PaymentMethodNetBanking   PaymentMethod = "net_banking"
	PaymentMethodCheque       PaymentMethod = "cheque"
	PaymentMethodBankTransfer PaymentMethod = "bank_transfer"
	PaymentMethodWallet       PaymentMethod = "wallet"
)

// tygo:emit
type DocumentType string

const (
	DocumentTypeLicense      DocumentType = "license"
	DocumentTypeInsurance    DocumentType = "insurance"
	DocumentTypeRegistration DocumentType = "registration"
	DocumentTypePUC          DocumentType = "puc"
	DocumentTypePermit       DocumentType = "permit"
	DocumentTypeAadhar       DocumentType = "aadhar"
	DocumentTypePAN          DocumentType = "pan"
	DocumentTypePassport     DocumentType = "passport"
	DocumentTypeOther        DocumentType = "other"
)

// tygo:emit
type PermissionAction string

const (
	PermissionActionCreate PermissionAction = "create"
	PermissionActionRead   PermissionAction = "read"
	PermissionActionUpdate PermissionAction = "update"
	PermissionActionDelete PermissionAction = "delete"
)

// tygo:emit
type PermissionResource string

const (
	PermissionResourceUser       PermissionResource = "user"
	PermissionResourceRole       PermissionResource = "role"
	PermissionResourcePermission PermissionResource = "permission"
	PermissionResourceSystem     PermissionResource = "system"
)

// tygo:emit
type ResponseStatus string

const (
	ResponseStatusSuccess ResponseStatus = "success"
	ResponseStatusError   ResponseStatus = "error"
)

// tygo:emit
type ErrorCode string

const (
	ErrorCodeValidation      ErrorCode = "VALIDATION_ERROR"
	ErrorCodeNotFound        ErrorCode = "NOT_FOUND"
	ErrorCodeUnauthorized    ErrorCode = "UNAUTHORIZED"
	ErrorCodeForbidden       ErrorCode = "FORBIDDEN"
	ErrorCodeInternalError   ErrorCode = "INTERNAL_ERROR"
	ErrorCodeBadRequest      ErrorCode = "BAD_REQUEST"
	ErrorCodeConflict        ErrorCode = "CONFLICT"
	ErrorCodeTooManyRequests ErrorCode = "TOO_MANY_REQUESTS"
)

type Status string

const (
	StatusActive    Status = "active"
	StatusInactive  Status = "inactive"
	StatusBlocked   Status = "blocked"
	StatusSuspended Status = "suspended"
)
