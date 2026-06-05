#[cfg(test)]
mod tests {
    use crate::{
        handlers::auth::AuthUser,
        handlers::rbac,
        models::user::UserRole,
    };

    #[test]
    fn test_superadmin_permissions() {
        println!("🔍 Testing SuperAdmin RBAC permissions...");

        // Test SuperAdmin user
        let superadmin = AuthUser {
            user_id: uuid::Uuid::new_v4(),
            role: UserRole::SuperAdmin,
            parish_id: None,
        };

        // SuperAdmin should be able to pass all RBAC checks
        assert!(rbac::require_super_admin(&superadmin).is_ok(), "SuperAdmin should pass require_super_admin");
        assert!(rbac::require_admin(&superadmin).is_ok(), "SuperAdmin should pass require_admin");
        assert!(rbac::require_write(&superadmin).is_ok(), "SuperAdmin should pass require_write");
        assert!(rbac::require_finance(&superadmin).is_ok(), "SuperAdmin should pass require_finance");

        // Test ParishAdmin user
        let parishadmin = AuthUser {
            user_id: uuid::Uuid::new_v4(),
            role: UserRole::ParishAdmin,
            parish_id: Some(uuid::Uuid::new_v4()),
        };

        // ParishAdmin should NOT be able to pass SuperAdmin check
        assert!(rbac::require_super_admin(&parishadmin).is_err(), "ParishAdmin should fail require_super_admin");
        assert!(rbac::require_admin(&parishadmin).is_ok(), "ParishAdmin should pass require_admin");
        assert!(rbac::require_write(&parishadmin).is_ok(), "ParishAdmin should pass require_write");
        assert!(rbac::require_finance(&parishadmin).is_ok(), "ParishAdmin should pass require_finance");

        // Test regular user (using Accountant as a regular user role)
        let regular_user = AuthUser {
            user_id: uuid::Uuid::new_v4(),
            role: UserRole::Accountant,
            parish_id: Some(uuid::Uuid::new_v4()),
        };

        // Regular user should NOT be able to pass SuperAdmin or Admin checks
        assert!(rbac::require_super_admin(&regular_user).is_err(), "Regular user should fail require_super_admin");
        assert!(rbac::require_admin(&regular_user).is_err(), "Regular user should fail require_admin");
        assert!(rbac::require_write(&regular_user).is_ok(), "Regular user should pass require_write");
        assert!(rbac::require_finance(&regular_user).is_ok(), "Accountant should pass require_finance");

        // Test Viewer user
        let viewer = AuthUser {
            user_id: uuid::Uuid::new_v4(),
            role: UserRole::Viewer,
            parish_id: Some(uuid::Uuid::new_v4()),
        };

        // Viewer should only have read access
        assert!(rbac::require_super_admin(&viewer).is_err(), "Viewer should fail require_super_admin");
        assert!(rbac::require_admin(&viewer).is_err(), "Viewer should fail require_admin");
        assert!(rbac::require_write(&viewer).is_err(), "Viewer should fail require_write");
        assert!(rbac::require_finance(&viewer).is_err(), "Viewer should fail require_finance");

        println!("✅ All RBAC permission tests passed!");
        println!("✅ SuperAdmin has proper elevated permissions");
        println!("✅ Other roles have appropriate restrictions");
    }

    #[test]
    fn test_parish_resolution() {
        println!("🔍 Testing parish ID resolution...");

        let test_parish_id = uuid::Uuid::new_v4();

        // SuperAdmin should be able to access any parish
        let superadmin = AuthUser {
            user_id: uuid::Uuid::new_v4(),
            role: UserRole::SuperAdmin,
            parish_id: Some(test_parish_id),
        };

        let requested_parish = uuid::Uuid::new_v4();
        let resolved = rbac::resolve_parish_id(&superadmin, Some(requested_parish));
        assert!(resolved.is_ok(), "SuperAdmin should be able to access any parish");
        assert_eq!(resolved.unwrap(), requested_parish, "SuperAdmin should get requested parish");

        // ParishAdmin should only be able to access their own parish
        let parishadmin = AuthUser {
            user_id: uuid::Uuid::new_v4(),
            role: UserRole::ParishAdmin,
            parish_id: Some(test_parish_id),
        };

        // Should be able to access their own parish
        let resolved = rbac::resolve_parish_id(&parishadmin, Some(test_parish_id));
        assert!(resolved.is_ok(), "ParishAdmin should be able to access their own parish");
        assert_eq!(resolved.unwrap(), test_parish_id, "ParishAdmin should get their own parish");

        // Should NOT be able to access different parish
        let different_parish = uuid::Uuid::new_v4();
        let resolved = rbac::resolve_parish_id(&parishadmin, Some(different_parish));
        assert!(resolved.is_err(), "ParishAdmin should NOT be able to access different parish");

        println!("✅ Parish resolution tests passed!");
        println!("✅ SuperAdmin can access any parish");
        println!("✅ ParishAdmin restricted to their own parish");
    }

    #[test]
    fn test_diocese_handler_permissions() {
        println!("🔍 Testing diocese handler permission checks...");

        // Test that diocese handlers require SuperAdmin
        let superadmin = AuthUser {
            user_id: uuid::Uuid::new_v4(),
            role: UserRole::SuperAdmin,
            parish_id: None,
        };

        let parishadmin = AuthUser {
            user_id: uuid::Uuid::new_v4(),
            role: UserRole::ParishAdmin,
            parish_id: Some(uuid::Uuid::new_v4()),
        };

        // SuperAdmin should pass diocese permission checks
        assert!(rbac::require_super_admin(&superadmin).is_ok(), "SuperAdmin should manage dioceses");

        // ParishAdmin should fail diocese permission checks
        assert!(rbac::require_super_admin(&parishadmin).is_err(), "ParishAdmin should NOT manage dioceses");

        println!("✅ Diocese handler permission tests passed!");
        println!("✅ Only SuperAdmin can manage dioceses");
    }
}
