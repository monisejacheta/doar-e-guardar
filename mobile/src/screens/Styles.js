import { StyleSheet } from 'react-native';

export const colors = {
  brandBlue: '#0b4f83',
  brandBlueDark: '#07345c',
  brandBlueSoft: '#e8f4fb',
  brandGreen: '#2f7d32',
  brandGreenSoft: '#eaf7e8',
  background: '#f7fafc',
  surface: '#ffffff',
  surfaceRaised: '#fbfdff',
  text: '#102a43',
  muted: '#52616b',
  border: '#bfd3df',
  primary: '#0b4f83',
  primaryText: '#ffffff',
  secondary: '#2f7d32',
  secondaryText: '#ffffff',
  icon: '#07345c',
  placeholder: '#5f6f7a',
  warning: '#b45309',
  warningSoft: '#fff7ed',
  caution: '#a16207',
  cautionSoft: '#fefce8',
  danger: '#b42318',
  dangerSoft: '#fff1f0',
  success: '#2f7d32',
  successSoft: '#eaf7e8',
  disabled: '#6f7f89',
  emptySoft: '#eef3f6',
  imagePlaceholder: '#dcebf3',
  overlay: 'rgba(7, 52, 92, 0.52)',
  scannerBackground: '#000000',
  scannerOverlay: 'rgba(0, 0, 0, 0.45)',
  scannerFrame: 'rgba(255, 255, 255, 0.05)'
};

export const spacing = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 24
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background
  },
  content: {
    gap: spacing.lg
  },
  header: {
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800'
  },
  subtitle: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 24
  },
  form: {
    gap: spacing.md
  },
  label: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700'
  },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 18,
    letterSpacing: 0,
    textAlign: 'center'
  },
  error: {
    color: colors.danger,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800'
  },
  button: {
    minHeight: 56,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  buttonDisabled: {
    backgroundColor: colors.disabled
  },
  buttonText: {
    color: colors.primaryText,
    fontWeight: '800',
    fontSize: 17,
    lineHeight: 22
  },
  pinScreen: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.background
  },
  pinHeader: {
    alignItems: 'center',
    gap: spacing.sm
  },
  pinIcon: {
    width: 68,
    height: 68,
    borderWidth: 1,
    borderColor: colors.brandBlue,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandBlueSoft
  },
  pinTitle: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center'
  },
  pinSubtitle: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'center'
  },
  pinDots: {
    minHeight: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md
  },
  pinDot: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 7,
    backgroundColor: colors.surface
  },
  pinDotFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  pinError: {
    minHeight: 24,
    color: colors.danger,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center'
  },
  pinKeyboard: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 344,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md
  },
  pinKey: {
    width: 96,
    height: 64,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  pinKeyText: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: 0
  },
  dashboard: {
    flex: 1,
    backgroundColor: colors.background
  },
  dashboardHeader: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md
  },
  dashboardHeaderRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  dashboardTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: 0
  },
  stockSortButton: {
    maxWidth: 178,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  stockSortButtonText: {
    flexShrink: 1,
    color: colors.primaryText,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center'
  },
  dashboardSubtitle: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0
  },
  dashboardState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg
  },
  dashboardStateText: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    letterSpacing: 0
  },
  productGridContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 118,
    gap: spacing.md
  },
  productGridRow: {
    justifyContent: 'space-between'
  },
  productCard: {
    width: '48%',
    aspectRatio: 0.78,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    overflow: 'hidden'
  },
  productCardLowStock: {
    borderWidth: 2,
    borderColor: colors.warning
  },
  productCardNearExpiration: {
    borderWidth: 2,
    borderColor: colors.danger
  },
  productCardExpired: {
    borderWidth: 2,
    borderColor: colors.danger
  },
  productCardExpiredRibbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    minHeight: 28,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm
  },
  productCardExpiredRibbonText: {
    color: colors.primaryText,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center'
  },
  productCardImage: {
    width: '100%',
    height: '42%',
    backgroundColor: colors.imagePlaceholder
  },
  productCardImagePlaceholder: {
    width: '100%',
    height: '42%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.imagePlaceholder
  },
  productCardBody: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between'
  },
  productCardCode: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    letterSpacing: 0
  },
  productCardName: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: 0
  },
  productCardQuantity: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: 0
  },
  productCardLowStockText: {
    color: colors.warning,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0
  },
  productCardFooter: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  productCardWithdrawButton: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  productCardWithdrawButtonText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0
  },
  productDetailScreen: {
    flex: 1,
    backgroundColor: colors.background
  },
  productDetailHeader: {
    minHeight: 64,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background
  },
  productDetailClose: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center'
  },
  productDetailContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg
  },
  productDetailImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: colors.imagePlaceholder
  },
  productDetailImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.imagePlaceholder
  },
  productDetailInfo: {
    gap: spacing.md
  },
  productDetailName: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '800',
    letterSpacing: 0
  },
  productDetailBarcode: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: 0
  },
  productDetailQuantityBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: 4
  },
  productDetailQuantityLabel: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    letterSpacing: 0
  },
  productDetailQuantity: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: 0
  },
  productLotsSection: {
    gap: spacing.md
  },
  productLotsTitle: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: 0
  },
  productLotCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm
  },
  productLotCardPriority: {
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft
  },
  productLotCardExpired: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft
  },
  productLotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  productLotBatchButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center'
  },
  productLotBatch: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: 0
  },
  productLotConsumption: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'right'
  },
  productLotPriority: {
    color: colors.warning,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'right'
  },
  productLotExpiredText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'right'
  },
  productLotWithdrawButton: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  productLotWithdrawButtonText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0
  },
  productLotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  productLotText: {
    flex: 1,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: 0
  },
  productLotQuantity: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: 0
  },
  productLotLocation: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: 0
  },
  withdrawOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.overlay
  },
  withdrawDialog: {
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    gap: spacing.lg
  },
  withdrawHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  withdrawTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: 0
  },
  withdrawCloseButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  withdrawLotSummary: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: 4
  },
  withdrawLotBatch: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: 0
  },
  withdrawLotText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: 0
  },
  withdrawLocationWarning: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    backgroundColor: colors.dangerSoft,
    padding: spacing.lg,
    gap: 4
  },
  withdrawLocationLabel: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    letterSpacing: 0
  },
  withdrawLocationValue: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: 0
  },
  withdrawLocationHelp: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: 0
  },
  withdrawQuantityRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  withdrawStepButton: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  withdrawInput: {
    flex: 1,
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0
  },
  withdrawConfirmButton: {
    minHeight: 58,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  withdrawConfirmButtonText: {
    color: colors.primaryText,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: 0
  },
  discardWarningText: {
    color: colors.danger,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: 0
  },
  discardConfirmButton: {
    minHeight: 58,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  dashboardTabBar: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg
  },
  dashboardTabItem: {
    flex: 1,
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4
  },
  dashboardTabText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    letterSpacing: 0
  },
  dashboardTabTextActive: {
    color: colors.primary
  },
  cloudStatusBanner: {
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.brandBlueSoft,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm
  },
  cloudStatusText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    letterSpacing: 0
  },
  historyScreen: {
    flex: 1,
    backgroundColor: colors.background
  },
  historyHeader: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md
  },
  historyTitle: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: 0
  },
  historyFilterInput: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: 0
  },
  historyListContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 118,
    gap: spacing.md
  },
  historyTableHeader: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    gap: spacing.sm
  },
  historyTableHeaderProduct: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 0
  },
  historyTableHeaderText: {
    width: 78,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'right'
  },
  historyRow: {
    minHeight: 94,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  historyProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.imagePlaceholder
  },
  historyProductImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.imagePlaceholder
  },
  historyProductInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4
  },
  historyProductName: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: 0
  },
  historyProductBatch: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 0
  },
  historyMovementInfo: {
    width: 78,
    alignItems: 'flex-end',
    gap: 4
  },
  historyMovementType: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 0
  },
  historyMovementEntry: {
    color: colors.success
  },
  historyMovementExit: {
    color: colors.danger
  },
  historyMovementQuantity: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 0
  },
  historyDateInfo: {
    width: 78,
    alignItems: 'flex-end',
    gap: 4
  },
  historyDateText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'right'
  },
  historyTimeText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'right'
  },
  alertScreen: {
    flex: 1,
    backgroundColor: colors.background
  },
  alertHeader: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md
  },
  alertHeaderText: {
    flex: 1,
    gap: 4
  },
  alertTitle: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: 0
  },
  alertSubtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: 0
  },
  alertUpdatedText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 0
  },
  alertMlWarning: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 0
  },
  alertRefreshButton: {
    width: 54,
    height: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  alertFilterWrap: {
    minHeight: 54,
    paddingBottom: spacing.md
  },
  alertFilterContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm
  },
  alertFilterChip: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  alertFilterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  alertFilterChipText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 0
  },
  alertFilterChipTextActive: {
    color: colors.primaryText
  },
  alertListContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 118,
    gap: spacing.md
  },
  alertCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.lg
  },
  alertCardRisk: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft
  },
  alertCardHigh: {
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft
  },
  alertCardLow: {
    borderColor: colors.caution,
    backgroundColor: colors.cautionSoft
  },
  alertCardSlow: {
    borderColor: colors.brandBlue,
    backgroundColor: colors.brandBlueSoft
  },
  alertCardEmpty: {
    opacity: 0.76,
    borderColor: colors.disabled,
    backgroundColor: colors.emptySoft
  },
  alertCardSafe: {
    borderColor: colors.success,
    backgroundColor: colors.successSoft
  },
  alertCardHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  alertStockoutPanel: {
    minHeight: 78,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: 2
  },
  alertStockoutLabel: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 0
  },
  alertStockoutValue: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: 0
  },
  alertTitleGroup: {
    flex: 1,
    minWidth: 0,
    gap: 4
  },
  alertProductName: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: 0
  },
  alertBatchText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 0
  },
  alertBadge: {
    maxWidth: 140,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  alertBadgeText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center'
  },
  alertMetricsRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm
  },
  alertMetric: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.md,
    justifyContent: 'center',
    gap: 2
  },
  alertMetricLabel: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 0
  },
  alertMetricValue: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: 0
  },
  alertFooter: {
    gap: 4
  },
  alertFooterText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 0
  },
  newProductScreen: {
    flex: 1,
    backgroundColor: colors.background
  },
  newProductHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md
  },
  newProductHeaderText: {
    flex: 1,
    gap: 4
  },
  newProductTitle: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: 0
  },
  newProductSubtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0
  },
  newProductForm: {
    padding: spacing.lg,
    gap: spacing.lg
  },
  newProductScroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 124,
    gap: spacing.lg
  },
  newProductPanel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.lg
  },
  newProductSectionTitle: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: 0
  },
  newProductField: {
    gap: spacing.sm
  },
  newProductInput: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0
  },
  newProductSelect: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  newProductSelectText: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: 0
  },
  selectOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay
  },
  selectMenu: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    gap: spacing.md
  },
  selectMenuTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: spacing.sm
  },
  selectOption: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  selectOptionActive: {
    backgroundColor: colors.brandBlueSoft,
    borderColor: colors.primary
  },
  selectOptionText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: 0
  },
  stepperRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  stepperButton: {
    width: 58,
    height: 58,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperInput: {
    flex: 1,
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0
  },
  newProductScanButton: {
    minHeight: 58,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  newProductActions: {
    gap: spacing.md
  },
  newProductSecondaryButton: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  newProductSecondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: 0
  },
  newProductScanButtonText: {
    color: colors.primaryText,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: 0
  },
  newProductPermissionText: {
    color: colors.danger,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: 0
  },
  newProductSuccessText: {
    color: colors.success,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: 0
  },
  onlineProductCard: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  onlineProductImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.imagePlaceholder
  },
  onlineProductImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.imagePlaceholder
  },
  onlineProductInfo: {
    flex: 1,
    gap: 4
  },
  onlineProductLabel: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 0
  },
  onlineProductName: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: 0
  },
  existingProductHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  existingProductSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    letterSpacing: 0
  },
  existingProductLabel: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: 0
  },
  existingLotCard: {
    minHeight: 84,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  existingLotCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.brandBlueSoft
  },
  existingLotEditPanel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
    gap: spacing.md
  },
  scannerScreen: {
    flex: 1,
    backgroundColor: colors.scannerBackground
  },
  scannerCamera: {
    flex: 1
  },
  scannerTopBar: {
    position: 'absolute',
    top: spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg
  },
  scannerCloseButton: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scannerOverlay,
    borderRadius: 8
  },
  scannerFrame: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: '30%',
    alignItems: 'center',
    gap: spacing.xl
  },
  scannerFrameBox: {
    width: '100%',
    aspectRatio: 1.65,
    borderWidth: 2,
    borderColor: colors.primaryText,
    borderRadius: 8,
    backgroundColor: colors.scannerFrame
  },
  scannerText: {
    color: colors.primaryText,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0
  }
});
