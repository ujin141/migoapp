import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import i18n from '@/i18n';

export function useLocalNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userId) return;

    // 권한 요청 (최초 실행 시)
    LocalNotifications.requestPermissions().then((result) => {
      if (result.display !== 'granted') {
        console.log('Local notifications permission not granted');
      }
    });

    const scheduleOfflineNotifications = async () => {
      // 기존에 예약된 알림 취소 (앱에 돌아왔으므로 리셋)
      await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }, { id: 3 }] });

      // 알림 내용 설정 (다국어 지원 가능하지만 여기서는 기본 텍스트 사용)
      const notifications = [
        {
          id: 1,
          title: '새로운 동행을 찾아보세요! ✈️',
          body: '내 근처에 새로운 여행자가 등록되었을지도 몰라요. 지금 확인해보세요!',
          schedule: { at: new Date(Date.now() + 1000 * 60 * 60 * 24) }, // 24시간 뒤
          smallIcon: 'ic_stat_icon_config_sample',
          actionTypeId: '',
          extra: null
        },
        {
          id: 2,
          title: '누군가 회원님에게 관심이 있어요 💕',
          body: '회원님의 프로필을 조회한 사람이 있습니다. 매칭 기회를 놓치지 마세요!',
          schedule: { at: new Date(Date.now() + 1000 * 60 * 60 * 48) }, // 48시간 뒤
          smallIcon: 'ic_stat_icon_config_sample',
          actionTypeId: '',
          extra: null
        },
        {
          id: 3,
          title: '여행 피드가 업데이트 되었습니다! 🌍',
          body: '여행자들이 남긴 새로운 사진과 팁을 구경해보세요. 이번 주말엔 어디로 떠날까요?',
          schedule: { at: new Date(Date.now() + 1000 * 60 * 60 * 72) }, // 72시간 뒤
          smallIcon: 'ic_stat_icon_config_sample',
          actionTypeId: '',
          extra: null
        }
      ];

      try {
        await LocalNotifications.schedule({ notifications });
        console.log('Local notifications scheduled for 24h, 48h, 72h');
      } catch (err) {
        console.error('Error scheduling local notifications:', err);
      }
    };

    const cancelOfflineNotifications = async () => {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    };

    // 앱 상태 변경 리스너 (백그라운드로 가면 예약, 포어그라운드로 오면 취소)
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        cancelOfflineNotifications();
      } else {
        scheduleOfflineNotifications();
      }
    });

    // 컴포넌트 마운트 시 (앱이 켜져있으므로) 기존 예약된 것 취소
    cancelOfflineNotifications();

    return () => {
      listener.then(l => l.remove());
    };
  }, [userId]);
}
