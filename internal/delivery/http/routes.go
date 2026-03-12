package http

import (
	"github.com/gin-gonic/gin"
	"github.com/skryfon/collex/internal/delivery/http/middleware"
	"github.com/skryfon/collex/internal/infrastructure/container"
)

// SetupCleanRoutes configures all routes using clean architecture
func SetupCleanRoutes(router *gin.Engine, container *container.Container) {
	// Add CORS middleware first (before any routes)
	router.Use(middleware.CORSWithDefaults())
	// Health check routes (no rate limiting)
	healthHandler := NewHealthHandler(container.Database)
	router.GET("/health", healthHandler.HealthCheck)
	router.GET("/ready", healthHandler.ReadinessCheck)
	router.GET("/live", healthHandler.LivenessCheck)
	router.GET("/health/detailed", healthHandler.DetailedHealthCheck)
	router.GET("/health/database", healthHandler.DatabaseHealthCheck)
	router.GET("/metrics", healthHandler.Metrics)

	// API routes with rate limiting
	api := router.Group("/api")
	api.Use(middleware.GlobalRateLimit(10000)) // Global rate limit of 1000 requests per minute

	// Create handlers using the container (avoiding import cycle)
	authHandler := NewAuthHandlerClean(
		container.AuthUseCase,
		container.AuditLogRepository,
		container.SecurityRepository,
	)

	// User handler for user-related operations
	userHandler := NewUserHandlerClean(
		container.UserUseCase,
	)
	medicineHanler := NewMedicineHandlerClean(
		container.MedicineUseCase,
		container.UserRepository,
	)
	doctorHanler := NewDoctorHandlerClean(
		container.DoctorUseCase,
	)
	orderHandler := NewOrderHandlerClean(
		container.OrderUsecase,
		container.PaymentUseCase,
		container.UserRepository,
		container.Config,
	)
	paymentHandler := NewPaymentHandlerClean(
		container.PaymentUseCase,
		container.UserRepository,
		container.Config,
	)
	patientEligibilityHandler := NewPatientEligibilityHandler(
		container.PatientEligibilityUseCase,
	)
	appoinmentHandler := NewAppoinmentHandlerClean(
		container.AppoinmentUseCase,
		container.UserRepository,
	)

	// Delivery Agent setup
	deliveryHandler := NewDeliveryHandlerClean(container.DeliveryUseCase)

	// Authentication routes (public)
	authRoutes := api.Group("/auth")
	{
		authRoutes.POST("/login", authHandler.Login)
		authRoutes.POST("/register", userHandler.CreateUser)
		authRoutes.POST("/refresh", authHandler.RefreshToken)
		authRoutes.GET("/roles", userHandler.FetchRoles)
		authRoutes.GET("/validate", authHandler.ValidateToken)
		authRoutes.POST("/forgot-password", authHandler.ForgotPassword)
		authRoutes.POST("/reset-password", authHandler.ResetPassword)
		authRoutes.GET("/invoice/:orderId", paymentHandler.GenerateInvoice)
		authRoutes.GET("/track/:orderId", orderHandler.TrackOrder)

	}

	// Protected routes (require authentication)
	protectedRoutes := api.Group("/")
	protectedRoutes.Use(middleware.JWTAuth(container.TokenService))
	{
		protectedRoutes.PUT("/profile", userHandler.UpdateUserProfile)
		protectedRoutes.PATCH("/profile/avatar", userHandler.UpdateAvatar)
		protectedRoutes.DELETE("/profile/avatar/delete", userHandler.DeleteAvatar)
		protectedRoutes.GET("profile", userHandler.GetUserProfile)

		// User profile and account management routes (authenticated users)
		patientRoutes := protectedRoutes.Group("/user")
		{
			patientRoutes.GET("/medicines", medicineHanler.GetMedicines)
			patientRoutes.POST("/doctors", doctorHanler.GetDoctors)
			patientRoutes.POST("/medicines", medicineHanler.GetMedicines)
			patientRoutes.PUT("/update-cart", orderHandler.UpdateCart)
			patientRoutes.POST("/add-cart", orderHandler.AddToCart)
			patientRoutes.GET("/view-cart", orderHandler.GetCart)
			patientRoutes.DELETE("/remove-cart", orderHandler.RemoveFromCart)

			patientRoutes.POST("/eligibility/apply", patientEligibilityHandler.ApplyForEligibility)
			patientRoutes.GET("/eligibility", patientEligibilityHandler.GetMyEligibility)
			patientRoutes.GET("/eligibility/active", patientEligibilityHandler.GetActiveEligibility)
			patientRoutes.POST("/order/free", orderHandler.CreateFreeMedicineOrder)

			patientRoutes.GET("/pharmacies", userHandler.GetActivePharmacies)
			patientRoutes.GET("/pharmacies/:id", userHandler.GetPharmacyDetails)

			patientRoutes.POST("/book-appointment", appoinmentHandler.BookAppointment)
			patientRoutes.GET("/confirmed-appointment-slots", appoinmentHandler.ConfirmedAppionmentSlot)

			patientRoutes.GET("/consultations", appoinmentHandler.FetchPatientConsultations)

			patientRoutes.GET("/profile", userHandler.GetUserProfile)
			patientRoutes.PUT("/profile", userHandler.UpdateUserProfile)
			patientRoutes.POST("/change-password", authHandler.ChangePassword)
			patientRoutes.PUT("/consultation/ispaid/:id", appoinmentHandler.UpdateIsPaid)
			patientRoutes.GET("/consultation/ispaid/:id", appoinmentHandler.GetIsPaid)

			// Option 1: Orders under /user/orders
			orderRoutes := patientRoutes.Group("/orders")
			{
				orderRoutes.GET("", orderHandler.GetUserOrders)    // /user/orders
				orderRoutes.GET("/:id", orderHandler.GetOrderByID) // /user/orders/:id
			}
		}
		//User Order Routed

		pharmacyRoutes := protectedRoutes.Group("/pharmacy")
		{
			pharmacyRoutes.POST("/add-medicine", medicineHanler.AddMedicine)
			pharmacyRoutes.GET("/list-medicine", medicineHanler.ListMedicines)
			pharmacyRoutes.PUT("/update-medicine/:id", medicineHanler.UpdateMedicine)
			pharmacyRoutes.GET("/get-medicine/:id", medicineHanler.GetMedicineByID)
			pharmacyRoutes.DELETE("/delete-medicine/:id", medicineHanler.DeleteMedicine)

			pharmacyRoutes.GET("/orders", orderHandler.GetPharmacyOrders)
			pharmacyRoutes.PUT("/orders/:id", orderHandler.UpdateOrderStatus)
			pharmacyRoutes.GET("/orders/revenue", orderHandler.GetTotalRevenue)

			/*
				pharmacyRoutes.GET("/orders/:id", orderHandler.GetOrderByID)
				pharmacyRoutes.PUT("/orders/:id", orderHandler.UpdateOrderStatus)*/

			// Delivery Agent Routes
			pharmacyRoutes.POST("/delivery-agents", deliveryHandler.AddDeliveryAgent)
			pharmacyRoutes.GET("/delivery-agents", deliveryHandler.GetPharmacyAgents)
			pharmacyRoutes.POST("/orders/:id/assign", deliveryHandler.AssignOrder)
			pharmacyRoutes.DELETE("/orders/:id/assign", deliveryHandler.UnassignOrder)
			pharmacyRoutes.PUT("/delivery-agents/:id", deliveryHandler.UpdateDeliveryAgent)
			pharmacyRoutes.DELETE("/delivery-agents/:id", deliveryHandler.DeleteDeliveryAgent)

		}

		deliveryRoutes := protectedRoutes.Group("/delivery")
		{
			deliveryRoutes.GET("/orders", deliveryHandler.GetDeliveryOrders)
			deliveryRoutes.PUT("/orders/:id/status", deliveryHandler.UpdateDeliveryStatus)
			deliveryRoutes.PUT("/status", deliveryHandler.UpdateAgentStatus)
		}

		paymentRoutes := protectedRoutes.Group("/payment")
		{
			paymentRoutes.POST("/create-order", paymentHandler.CreateOrder)
			paymentRoutes.POST("/verify", paymentHandler.VerifyPayment)
			paymentRoutes.GET("/status/:orderId", paymentHandler.GetPaymentStatus)
			paymentRoutes.GET("/history", paymentHandler.GetUserPayments)
		}
		doctorRoutes := protectedRoutes.Group("/doctor")
		{
			doctorRoutes.GET("/schedule", appoinmentHandler.GetDoctorSchedule)
			doctorRoutes.POST("/schedule-appointment", appoinmentHandler.ScheduleAppointment)
			doctorRoutes.GET("/consultations", appoinmentHandler.FetchConsultations)
			doctorRoutes.DELETE("/cancel-appointment", appoinmentHandler.CancelAppointment)
			doctorRoutes.POST("/complete-consultation", appoinmentHandler.CompleteConsultation)
			doctorRoutes.GET("/appoinment-stats", appoinmentHandler.GetAppointmentStats)

		}
		// Admin routes (require authentication + admin role)
		adminRoutes := protectedRoutes.Group("/admin")
		//adminRoutes.Use(middleware.RoleBasedAccess(string(shared.UserRoleAdmin), string(shared.UserRoleSuperAdmin)))
		{
			// User management routes (admin only)
			adminUserRoutes := adminRoutes.Group("/users")

			adminRoutes.GET("/eligibility", patientEligibilityHandler.GetAllEligibilityRequests) // Placeholder
			adminRoutes.PUT("/eligibility/:id/approve", patientEligibilityHandler.ApproveEligibility)
			adminRoutes.PUT("/eligibility/:id/reject", patientEligibilityHandler.RejectEligibility)

			adminRoutes.PUT("/pharmacies/:id/free-medicine", userHandler.ToggleFreeMedicineStatus)

			{
				//adminUserRoutes.GET("/roles", userHandler.FetchRoles)
				adminUserRoutes.GET("", userHandler.ListUsers)                  // GET /api/admin/users
				adminUserRoutes.GET("/:id", userHandler.GetUserByID)            // GET /api/admin/users/:id				           // Matches /api/admin/users				adminUserRoutes.GET("/:id", userHandler.GetUserByID)            // Get specific user by ID
				adminUserRoutes.PUT("/update-user/:id", userHandler.UpdateUser) // Changed from update/:id to standard REST
				adminUserRoutes.GET("/:id/profile", userHandler.UserProfile)    // Get user profile by ID
				adminUserRoutes.GET("/stats", userHandler.GetStatusCount)

				// Apply SuperAdmin middleware only to this specific route
				adminUserRoutes.PUT("/:id/status", userHandler.UpdateUserStatus)
			}
		}
	}
}

// SetupRoutesWithContainer is a convenience function that creates both container and routes
// This is kept for future extensibility but currently unused
