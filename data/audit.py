import os

files = [
    ('F:/BWF/BWF-Backend/.env',                              'Backend .env'),
    ('F:/BWF/BWF-Backend/.env.example',                      'Backend .env.example'),
    ('F:/BWF/BWF-Backend/index.js',                          'Backend index.js'),
    ('F:/BWF/BWF-Backend/auth/controller.js',                'auth/controller.js'),
    ('F:/BWF/BWF-Backend/auth/service.js',                   'auth/service.js'),
    ('F:/BWF/BWF-Backend/auth/route.js',                     'auth/route.js'),
    ('F:/BWF/BWF-Backend/models/User.js',                    'models/User.js'),
    ('F:/BWF/BWF-Backend/warden/routes.js',                  'warden/routes.js'),
    ('F:/BWF/BWF-Backend/student/profile/routes.js',         'student profile routes'),
    ('F:/BWF/BWF-Web-Dashboard/app/admin/login/page.tsx',    'Admin login page.tsx'),
    ('F:/BWF/BWF-Web-Dashboard/app/admin/dashboard/page.tsx','Admin dashboard page.tsx'),
    ('F:/BWF/BWF-Web-Dashboard/app/auth/login/service.ts',   'Auth login service.ts'),
    ('F:/BWF/BWF-Web-Dashboard/app/admin/components/AuthGuard.tsx', 'AuthGuard.tsx'),
    ('F:/BWF/BWF-Web-Dashboard/.env.local',                  'Web Dashboard .env.local'),
    ('F:/BWF/BWF-student-dashboard/app/page.tsx',            'Student landing page.tsx'),
    ('F:/BWF/BWF-student-dashboard/.env.local',              'Student .env.local'),
]

print(f"{'STATUS':<16} {'LABEL':<36} PATH")
print("-" * 100)
all_ok = True
for path, label in files:
    if os.path.exists(path):
        size = os.path.getsize(path)
        if size == 0:
            flag = 'EMPTY ❌'
            all_ok = False
        else:
            flag = f'OK ({size}B)'
    else:
        flag = 'MISSING ❌'
        all_ok = False
    print(f"{flag:<16} {label:<36} {path}")

print()
if all_ok:
    print("✅ All files present and non-empty.")
else:
    print("⚠️  Some files need attention (see above).")
