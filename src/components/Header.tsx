type HeaderProps = {
  darkMode?: boolean;
  onMenu: () => void;
  onNotifications?: () => void;
};

export default function Header(_props: HeaderProps) {
  // تم إزالة الزر القديم تماماً للاعتماد على المقبض الجانبي الحديث
  return null;
}