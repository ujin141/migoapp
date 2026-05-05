import UIKit
import Capacitor
import Firebase
import FirebaseMessaging

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // ── Firebase 초기화 (GoogleService-Info.plist 자동 인식) ──
        // NSException은 Swift do/catch로 잡을 수 없으므로 ObjC 래퍼 사용
        let firebaseOK = ObjCExceptionCatcher.catchException {
            FirebaseApp.configure()
        }

        if firebaseOK {
            // ── FCM 딜리게이트 등록 ──
            Messaging.messaging().delegate = self
        } else {
            NSLog("⚠️ [Migo] Firebase initialization failed — push notifications will be unavailable. Check GoogleService-Info.plist.")
        }

        // ── APNs 원격 알림 등록 ──
        UNUserNotificationCenter.current().delegate = self

        return true
    }

    // ── APNs 토큰 → Firebase에 전달 (FCM 토큰 자동 매핑) ──
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        if FirebaseApp.app() != nil {
            Messaging.messaging().apnsToken = deviceToken
        }
        NotificationCenter.default.post(
            name: .capacitorDidRegisterForRemoteNotifications,
            object: deviceToken
        )
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        NotificationCenter.default.post(
            name: .capacitorDidFailToRegisterForRemoteNotifications,
            object: error
        )
    }

    // MARK: – Lifecycle

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationDidBecomeActive(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        return ApplicationDelegateProxy.shared.application(
            application,
            continue: userActivity,
            restorationHandler: restorationHandler
        )
    }
}

// MARK: – MessagingDelegate (FCM 토큰 갱신 수신)
extension AppDelegate: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        // FCM 토큰이 갱신될 때마다 Capacitor 레이어로 전달
        // → usePushNotifications.ts의 "registration" 리스너가 이 토큰을 DB에 저장
        guard let token = fcmToken else { return }
        let dataDict: [String: String] = ["token": token]
        NotificationCenter.default.post(
            name: Notification.Name("FCMToken"),
            object: nil,
            userInfo: dataDict
        )
    }
}

// MARK: – UNUserNotificationCenterDelegate (포그라운드 알림 표시)
extension AppDelegate: UNUserNotificationCenterDelegate {
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // 앱이 foreground 상태에서도 배너 + 사운드 표시
        completionHandler([.banner, .badge, .sound])
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        completionHandler()
    }
}
