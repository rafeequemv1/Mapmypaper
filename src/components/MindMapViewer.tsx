import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { useMutation } from '@tanstack/react-query'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useDebounce } from '@/hooks/use-debounce'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Edit,
  Trash,
  File,
  Download,
  Share2,
  Image,
  Code,
  HelpCircle,
  Copy,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Layout,
  Search,
  X,
} from 'lucide-react'
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from '@/components/ui/resizable'
import { useTheme } from '@/components/ThemeProvider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
import { useHotkeys } from 'react-hotkeys-hook'
import { useEventListener } from 'usehooks-ts'
import { isMacOs } from 'react-device-detect'
import {
  ResizableHandleDirection,
  ResizablePanelResizeEvent,
} from 'react-resizable-panels'
import {
  DEFAULT_NODE_CONFIG,
  DEFAULT_LINK_CONFIG,
  DEFAULT_MINDMAP_CONFIG,
  DEFAULT_PLUGIN_CONFIG,
  DEFAULT_HISTORY_CONFIG,
  DEFAULT_DRAG_CONFIG,
  DEFAULT_KEYBOARD_CONFIG,
  DEFAULT_SELECTION_CONFIG,
  DEFAULT_UI_CONFIG,
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_CONTEXTMENU_CONFIG,
  DEFAULT_SEARCH_CONFIG,
  DEFAULT_NODE_STYLE,
  DEFAULT_LINK_STYLE,
  DEFAULT_MINDMAP_STYLE,
  DEFAULT_THEME,
  DEFAULT_I18N,
  DEFAULT_EVENTS,
  DEFAULT_DATA,
} from './defaultConfig'
import {
  getTheme,
  getThemeVariables,
  getThemeRules,
  getThemeUtils,
} from './theme'
import {
  getLayout,
  getLayoutVariables,
  getLayoutRules,
  getLayoutUtils,
} from './layout'
import {
  getNode,
  getNodeVariables,
  getNodeRules,
  getNodeUtils,
} from './node'
import {
  getLink,
  getLinkVariables,
  getLinkRules,
  getLinkUtils,
} from './link'
import {
  getMindmap,
  getMindmapVariables,
  getMindmapRules,
  getMindmapUtils,
} from './mindmap'
import {
  getPlugin,
  getPluginVariables,
  getPluginRules,
  getPluginUtils,
} from './plugin'
import {
  getHistory,
  getHistoryVariables,
  getHistoryRules,
  getHistoryUtils,
} from './history'
import {
  getDrag,
  getDragVariables,
  getDragRules,
  getDragUtils,
} from './drag'
import {
  getKeyboard,
  getKeyboardVariables,
  getKeyboardRules,
  getKeyboardUtils,
} from './keyboard'
import {
  getSelection,
  getSelectionVariables,
  getSelectionRules,
  getSelectionUtils,
} from './selection'
import {
  getUI,
  getUIVariables,
  getUIRules,
  getUIUtils,
} from './ui'
import {
  getLayoutConfig,
  getLayoutConfigVariables,
  getLayoutConfigRules,
  getLayoutConfigUtils,
} from './layoutConfig'
import {
  getContextMenu,
  getContextMenuVariables,
  getContextMenuRules,
  getContextMenuUtils,
} from './contextMenu'
import {
  getSearch,
  getSearchVariables,
  getSearchRules,
  getSearchUtils,
} from './search'
import {
  getNodeStyle,
  getNodeStyleVariables,
  getNodeStyleRules,
  getNodeStyleUtils,
} from './nodeStyle'
import {
  getLinkStyle,
  getLinkStyleVariables,
  getLinkStyleRules,
  getLinkStyleUtils,
} from './linkStyle'
import {
  getMindmapStyle,
  getMindmapStyleVariables,
  getMindmapStyleRules,
  getMindmapStyleUtils,
} from './mindmapStyle'
import {
  getI18n,
  getI18nVariables,
  getI18nRules,
  getI18nUtils,
} from './i18n'
import {
  getEvents,
  getEventsVariables,
  getEventsRules,
  getEventsUtils,
} from './events'
import {
  getData,
  getDataVariables,
  getDataRules,
  getDataUtils,
} from './data'
import {
  useMindElixir,
  MindElixir,
  MindElixirCtx,
  MindElixirMethods,
  MindElixirProps,
  MindElixirRef,
  MindElixirData,
  MindElixirNode,
  MindElixirLink,
  MindElixirEvent,
  MindElixirOptions,
  MindElixirConfig,
  MindElixirStyle,
  MindElixirTheme,
  MindElixirI18n,
  MindElixirEvents,
  MindElixirLocale,
  MindElixirThemeVariables,
  MindElixirLayoutVariables,
  MindElixirNodeVariables,
  MindElixirLinkVariables,
  MindElixirMindmapVariables,
  MindElixirPluginVariables,
  MindElixirHistoryVariables,
  MindElixirDragVariables,
  MindElixirKeyboardVariables,
  MindElixirSelectionVariables,
  MindElixirUIVariables,
  MindElixirLayoutConfigVariables,
  MindElixirContextMenuVariables,
  MindElixirSearchVariables,
  MindElixirNodeStyleVariables,
  MindElixirLinkStyleVariables,
  MindElixirMindmapStyleVariables,
  MindElixirI18nVariables,
  MindElixirEventsVariables,
  MindElixirDataVariables,
  MindElixirThemeRules,
  MindElixirLayoutRules,
  MindElixirNodeRules,
  MindElixirLinkRules,
  MindElixirMindmapRules,
  MindElixirPluginRules,
  MindElixirHistoryRules,
  MindElixirDragRules,
  MindElixirKeyboardRules,
  MindElixirSelectionRules,
  MindElixirUIRules,
  MindElixirLayoutConfigRules,
  MindElixirContextMenuRules,
  MindElixirSearchRules,
  MindElixirNodeStyleRules,
  MindElixirLinkStyleRules,
  MindElixirMindmapStyleRules,
  MindElixirI18nRules,
  MindElixirEventsRules,
  MindElixirDataRules,
  MindElixirThemeUtils,
  MindElixirLayoutUtils,
  MindElixirNodeUtils,
  MindElixirLinkUtils,
  MindElixirMindmapUtils,
  MindElixirPluginUtils,
  MindElixirHistoryUtils,
  MindElixirDragUtils,
  MindElixirKeyboardUtils,
  MindElixirSelectionUtils,
  MindElixirUIUtils,
  MindElixirLayoutConfigUtils,
  MindElixirContextMenuUtils,
  MindElixirSearchUtils,
  MindElixirNodeStyleUtils,
  MindElixirLinkStyleUtils,
  MindElixirMindmapStyleUtils,
  MindElixirI18nUtils,
  MindElixirEventsUtils,
  MindElixirDataUtils,
} from 'mind-elixir-react'

interface MindMapViewerProps {
  initialData?: MindElixirData
  options?: MindElixirOptions
  config?: MindElixirConfig
  style?: MindElixirStyle
  theme?: MindElixirTheme
  i18n?: MindElixirI18n
  events?: MindElixirEvents
  locale?: MindElixirLocale
  onChange?: (data: MindElixirData) => void
  onNodeCreate?: (node: MindElixirNode) => void
  onNodeUpdate?: (node: MindElixirNode) => void
  onNodeDelete?: (node: MindElixirNode) => void
  onLinkCreate?: (link: MindElixirLink) => void
  onLinkUpdate?: (link: MindElixirLink) => void
  onLinkDelete?: (link: MindElixirLink) => void
  onEvent?: (event: MindElixirEvent) => void
  onReady?: (mindElixir: MindElixirMethods) => void
  onError?: (error: Error) => void
}

const MindMapViewer: React.FC<MindMapViewerProps> = ({
  initialData = DEFAULT_DATA,
  options = {},
  config = {},
  style = {},
  theme = DEFAULT_THEME,
  i18n = DEFAULT_I18N,
  events = DEFAULT_EVENTS,
  locale = 'en',
  onChange,
  onNodeCreate,
  onNodeUpdate,
  onNodeDelete,
  onLinkCreate,
  onLinkUpdate,
  onLinkDelete,
  onEvent,
  onReady,
  onError,
}) => {
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false)
  const [isLayoutDialogOpen, setIsLayoutDialogOpen] = useState(false)
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isMindmapDialogOpen, setIsMindmapDialogOpen] = useState(false)
  const [isPluginDialogOpen, setIsPluginDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] useState(false)
  const [isDragDialogOpen, setIsDragDialogOpen] = useState(false)
  const [isKeyboardDialogOpen, setIsKeyboardDialogOpen] = useState(false)
  const [isSelectionDialogOpen, setIsSelectionDialogOpen] = useState(false)
  const [isUIDialogOpen, setIsUIDialogOpen] = useState(false)
  const [isLayoutConfigDialogOpen, setIsLayoutConfigDialogOpen] = useState(false)
  const [isContextMenuDialogOpen, setIsContextMenuDialogOpen] = useState(false)
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [isNodeStyleDialogOpen, setIsNodeStyleDialogOpen] = useState(false)
  const [isLinkStyleDialogOpen, setIsLinkStyleDialogOpen] = useState(false)
  const [isMindmapStyleDialogOpen, setIsMindmapStyleDialogOpen] = useState(false)
  const [isI18nDialogOpen, setIsI18nDialogOpen] = useState(false)
  const [isEventsDialogOpen, setIsEventsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDataDialogOpen, setIsDataDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isZoomingIn, setIsZoomingIn] = useState(false)
  const [isZoomingOut, setIsZoomingOut] = useState(false)
  const [isZoomingReset, setIsZoomingReset] = useState(false)
  const [isLayouting, setIsLayouting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isUndoing, setIsUndoing] = useState(false)
  const [isRedoing, setIsRedoing] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [isPasting, setIsPasting] = useState(false)
  const [isCutting, setIsCutting] = useState(false)
  const [isSelectingAll, setIsSelectingAll] = useState(false)
  const [isDeselectingAll, setIsDeselectingAll] = useState(false)
  const [isDeletingSelected, setIsDeletingSelected] = useState(false)
  const [isCollapsingAll, setIsCollapsingAll] = useState(false)
  const [isExpandingAll, setIsExpandingAll] = useState(false)
  const [isFocusing, setIsFocusing] = useState(false)
  const [isHiding, setIsHiding] = useState(false)
  const [isShowing, setIsShowing] = useState(false)
  const [isLocking, setIsLocking] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isMovingUp, setIsMovingUp] = useState(false)
  const [isMovingDown, setIsMovingDown] = useState(false)
  const [isMovingLeft, setIsMovingLeft] = useState(false)
  const [isMovingRight, setIsMovingRight] = useState(false)
  const [isAddingChild, setIsAddingChild] = useState(false)
  const [isAddingSibling, setIsAddingSibling] = useState(false)
  const [isAddingParent, setIsAddingParent] = useState(false)
  const [isAddingLink, setIsAddingLink] = useState(false)
  const [isAddingImage, setIsAddingImage] = useState(false)
  const [isAddingCode, setIsAddingCode] = useState(false)
  const [isAddingHelp, setIsAddingHelp] = useState(false)
  const [isAddingFile, setIsAddingFile] = useState(false)
  const [isAddingDownload, setIsAddingDownload] = useState(false)
  const [isAddingShare, setIsAddingShare] = useState(false)
  const [isAddingLayout, setIsAddingLayout] = useState(false)
  const [isAddingSearch, setIsAddingSearch] = useState(false)
  const [isAddingZoomIn, setIsAddingZoomIn] = useState(false)
  const [isAddingZoomOut, setIsAddingZoomOut] = useState(false)
  const [isAddingZoomReset, setIsAddingZoomReset] = useState(false)
  const [isAddingUndo, setIsAddingUndo] = useState(false)
  const [isAddingRedo, setIsAddingRedo] = useState(false)
  const [isAddingCopy, setIsAddingCopy] = useState(false)
  const [isAddingCut, setIsAddingCut] = useState(false)
  const [isAddingPaste, setIsAddingPaste] = useState(false)
  const [isAddingSelectAll, setIsAddingSelectAll] = useState(false)
  const [isAddingDeselectAll, setIsAddingDeselectAll] = useState(false)
  const [isAddingDeleteSelected, setIsAddingDeleteSelected] = useState(false)
  const [isAddingCollapseAll, setIsAddingCollapseAll] = useState(false)
  const [isAddingExpandAll, setIsAddingExpandAll] = useState(false)
  const [isAddingFocus, setIsAddingFocus] = useState(false)
  const [isAddingHide, setIsAddingHide] = useState(false)
  const [isAddingShow, setIsAddingShow] = useState(false)
  const [isAddingLock, setIsAddingLock] = useState(false)
  const [isAddingUnlock, setIsAddingUnlock] = useState(false)
  const [isAddingMoveUp, setIsAddingMoveUp] = useState(false)
  const [isAddingMoveDown, setIsAddingMoveDown] = useState(false)
  const [isAddingMoveLeft, setIsAddingMoveLeft] = useState(false)
  const [isAddingMoveRight, setIsAddingMoveRight] = useState(false)
  const [isAddingEdit, setIsAddingEdit] = useState(false)
  const [isAddingDelete, setIsAddingDelete] = useState(false)
  const [isAddingDuplicate, setIsAddingDuplicate] = useState(false)
  const [isAddingSave, setIsAddingSave] = useState(false)
  const [isAddingExport, setIsAddingExport] = useState(false)
  const [isAddingImport, setIsAddingImport] = useState(false)
  const [isAddingSettings, setIsAddingSettings] = useState(false)
  const [isAddingTheme, setIsAddingTheme] = useState(false)
  const [isAddingLayoutConfig, setIsAddingLayoutConfig] = useState(false)
  const [isAddingNodeConfig, setIsAddingNodeConfig] = useState(false)
  const [isAddingLinkConfig, setIsAddingLinkConfig] = useState(false)
  const [isAddingMindmapConfig, setIsAddingMindmapConfig] = useState(false)
  const [isAddingPluginConfig, setIsAddingPluginConfig] = useState(false)
  const [isAddingHistoryConfig, setIsAddingHistoryConfig] = useState(false)
  const [isAddingDragConfig, setIsAddingDragConfig] = useState(false)
  const [isAddingKeyboardConfig, setIsAddingKeyboardConfig] = useState(false)
  const [isAddingSelectionConfig, setIsAddingSelectionConfig] = useState(false)
  const [isAddingUIConfig, setIsAddingUIConfig] = useState(false)
  const [isAddingContextMenuConfig, setIsAddingContextMenuConfig] = useState(false)
  const [isAddingSearchConfig, setIsAddingSearchConfig] = useState(false)
  const [isAddingNodeStyleConfig, setIsAddingNodeStyleConfig] = useState(false)
  const [isAddingLinkStyleConfig, setIsAddingLinkStyleConfig] = useState(false)
  const [isAddingMindmapStyleConfig, setIsAddingMindmapStyleConfig] = useState(false)
  const [isAddingI18nConfig, setIsAddingI18nConfig] = useState(false)
  const [isAddingEventsConfig, setIsAddingEventsConfig] = useState(false)
  const [isAddingDataConfig, setIsAddingDataConfig] = useState(false)
  const [isAddingEditConfig, setIsAddingEditConfig] = useState(false)
  const [isAddingDeleteConfig, setIsAddingDeleteConfig] = useState(false)
  const [isAddingDuplicateConfig, setIsAddingDuplicateConfig] = useState(false)
  const [isAddingZoomInConfig, setIsAddingZoomInConfig] = useState(false)
  const [isAddingZoomOutConfig, setIsAddingZoomOutConfig] = useState(false)
  const [isAddingZoomResetConfig, setIsAddingZoomResetConfig] = useState(false)
  const [isAddingLayoutConfigConfig, setIsAddingLayoutConfigConfig] = useState(false)
  const [isAddingUndoConfig, setIsAddingUndoConfig] = useState(false)
  const [isAddingRedoConfig, setIsAddingRedoConfig] = useState(false)
  const [isAddingCopyConfig, setIsAddingCopyConfig] = useState(false)
  const [isAddingCutConfig, setIsAddingCutConfig] = useState(false)
  const [isAddingPasteConfig, setIsAddingPasteConfig] = useState(false)
  const [isAddingSelectAllConfig, setIsAddingSelectAllConfig] = useState(false)
  const [isAddingDeselectAllConfig, setIsAddingDeselectAllConfig] = useState(false)
  const [isAddingDeleteSelectedConfig, setIsAddingDeleteSelectedConfig] = useState(false)
  const [isAddingCollapseAllConfig, setIsAddingCollapseAllConfig] = useState(false)
  const [isAddingExpandAllConfig, setIsAddingExpandAllConfig] = useState(false)
  const [isAddingFocusConfig, setIsAddingFocusConfig] = useState(false)
  const [isAddingHideConfig, setIsAddingHideConfig] = useState(false)
  const [isAddingShowConfig, setIsAddingShowConfig] = useState(false)
  const [isAddingLockConfig, setIsAddingLockConfig] = useState(false)
  const [isAddingUnlockConfig, setIsAddingUnlockConfig] = useState(false)
  const [isAddingMoveUpConfig, setIsAddingMoveUpConfig] = useState(false)
  const [isAddingMoveDownConfig, setIsAddingMoveDownConfig] = useState(false)
  const [isAddingMoveLeftConfig, setIsAddingMoveLeftConfig] = useState(false)
  const [isAddingMoveRightConfig, setIsAddingMoveRightConfig] = useState(false)
  const [isAddingSaveConfig, setIsAddingSaveConfig] = useState(false)
  const [isAddingExportConfig, setIsAddingExportConfig] = useState(false)
  const [isAddingImportConfig, setIsAddingImportConfig] = useState(false)
  const [isAddingSettingsConfig, setIsAddingSettingsConfig] = useState(false)
  const [isAddingThemeConfig, setIsAddingThemeConfig] = useState(false)
  const [isAddingLayoutConfigConfigConfig, setIsAddingLayoutConfigConfig] = useState(false)
  const [isAddingNodeStyleConfigConfig, setIsAddingNodeStyleConfigConfig] = useState(false)
  const [isAddingLinkStyleConfigConfig, setIsAddingLinkStyleConfigConfig] = useState(false)
  const [isAddingMindmapStyleConfigConfig, setIsAddingMindmapStyleConfigConfig] = useState(false)
  const [isAddingI18nConfigConfig, setIsAddingI18nConfigConfig] = useState(false)
  const [isAddingEventsConfigConfig, setIsAddingEventsConfigConfig] = useState(false)
  const [isAddingDataConfigConfig, setIsAddingDataConfigConfig] = useState(false)
  const [isAddingEditConfigConfig, setIsAddingEditConfigConfig] = useState(false)
  const [isAddingDeleteConfigConfig, setIsAddingDeleteConfigConfig] = useState(false)
  const [isAddingDuplicateConfigConfig, setIsAddingDuplicateConfigConfig] = useState(false)
  const [isAddingZoomInConfigConfig, setIsAddingZoomInConfigConfig] = useState(false)
  const [isAddingZoomOutConfigConfig, setIsAddingZoomOutConfigConfig] = useState(false)
  const [isAddingZoomResetConfigConfig, setIsAddingZoomResetConfigConfig] = useState(false)
  const [isAddingLayoutConfigConfigConfigConfig, setIsAddingLayoutConfigConfigConfig] = useState(false)
  const [isAddingUndoConfigConfig, setIsAddingUndoConfigConfig] = useState(false)
  const [isAddingRedoConfigConfig, setIsAddingRedoConfigConfig] = useState(false)
  const [isAddingCopyConfigConfig, setIsAddingCopyConfigConfig] = useState(false)
  const [isAddingCutConfigConfig, setIsAddingCutConfigConfig] = useState(false)
  const [isAddingPasteConfigConfig, setIsAddingPasteConfigConfig] = useState(false)
  const [isAddingSelectAllConfigConfig, setIsAddingSelectAllConfigConfig] = useState(false)
  const [isAddingDeselectAllConfigConfig, setIsAddingDeselectAllConfigConfig] = useState(false)
  const [isAddingDeleteSelectedConfigConfig, setIsAddingDeleteSelectedConfigConfig] = useState(false)
  const [isAddingCollapseAllConfigConfig, setIsAddingCollapseAllConfigConfig] = useState(false)
  const [isAddingExpandAllConfigConfig, setIsAddingExpandAllConfigConfig] = useState(false)
  const [isAddingFocusConfigConfig, setIsAddingFocusConfigConfig] = useState(false)
  const [isAddingHideConfigConfig, setIsAddingHideConfigConfig] = useState(false)
  const [isAddingShowConfigConfig, setIsAddingShowConfigConfig] = useState(false)
  const [isAddingLockConfigConfig, setIsAddingLockConfigConfig] = useState(false)
  const [isAddingUnlockConfigConfig, setIsAddingUnlockConfigConfig] = useState(false)
  const [isAddingMoveUpConfigConfig, setIsAddingMoveUpConfigConfig] = useState(false)
  const [isAddingMoveDownConfigConfig, setIsAddingMoveDownConfigConfig] = useState(false)
  const [isAddingMoveLeftConfigConfig, setIsAddingMoveLeftConfigConfig] = useState(false)
  const [isAddingMoveRightConfigConfig, setIsAddingMoveRightConfigConfig] = useState(false)
  const [isAddingSaveConfigConfig, setIsAddingSaveConfigConfig] = useState(false)
  const [isAddingExportConfigConfig, setIsAddingExportConfigConfig] = useState(false)
  const [isAddingImportConfigConfig, setIsAddingImportConfigConfig] = useState(false)
  const [isAddingSettingsConfigConfig, setIsAddingSettingsConfigConfig] = useState(false)
  const [isAddingThemeConfigConfig, setIsAddingThemeConfigConfig] = useState(false)
  const [isAddingLayoutConfigConfigConfigConfig, setIsAddingLayoutConfigConfigConfigConfig] = useState(false)
  const [isAddingNodeStyleConfigConfigConfig, setIsAddingNodeStyleConfigConfigConfig] = useState(false)
  const [isAddingLinkStyleConfigConfigConfig, setIsAddingLinkStyleConfigConfigConfig] = useState(false)
  const [isAddingMindmapStyleConfigConfigConfig, setIsAddingMindmapStyleConfigConfigConfig] = useState(false)
  const [isAddingI18nConfigConfigConfig, setIsAddingI18nConfigConfigConfig] = useState(false)
  const [isAddingEventsConfigConfigConfig, setIsAddingEventsConfigConfigConfig] = useState(false)
  const [isAddingDataConfigConfigConfig, setIsAddingDataConfigConfigConfig] = useState(false)
  const [isAddingEditConfigConfigConfig, setIsAddingEditConfigConfigConfig] = useState(false)
  const [isAddingDeleteConfigConfigConfig, setIsAddingDeleteConfigConfigConfig] = useState(false)
  const [isAddingDuplicateConfigConfigConfig, setIsAddingDuplicateConfigConfigConfig] = useState(false)
  const [isAddingZoomInConfigConfigConfig, setIsAddingZoomInConfigConfigConfig] = useState(false)
  const [isAddingZoomOutConfigConfigConfig, setIsAddingZoomOutConfigConfigConfig] = useState(false)
  const [isAddingZoomResetConfigConfigConfig, setIsAddingZoomResetConfigConfigConfig] = useState(false)
  const [isAddingLayoutConfigConfigConfigConfigConfig, setIsAddingLayoutConfigConfigConfigConfigConfig] = useState(false)
  const [isAddingUndoConfigConfigConfig, setIsAddingUndoConfigConfigConfig] = useState(false)
  const [isAddingRedoConfigConfigConfig, setIsAddingRedoConfigConfigConfig] = useState(false)
  const [isAddingCopyConfigConfigConfig, setIsAddingCopyConfigConfigConfig] = useState(false)
  const [isAddingCutConfigConfigConfig, setIsAddingCutConfigConfigConfig] = useState(false)
  const [isAddingPasteConfigConfigConfig, setIsAddingPasteConfigConfigConfig] = useState(false)
  const [isAddingSelectAllConfigConfigConfig, setIsAddingSelectAllConfigConfigConfig] = useState(false)
  const [isAddingDeselectAllConfigConfigConfig, setIsAddingDeselectAllConfigConfigConfig] = useState(false)
  const [isAddingDeleteSelectedConfigConfigConfig, setIsAddingDeleteSelectedConfigConfigConfig] = useState(false)
  const [isAddingCollapseAllConfigConfigConfig, setIsAddingCollapseAllConfigConfigConfig] = useState(false)
  const [isAddingExpandAllConfigConfigConfig, setIsAddingExpandAllConfigConfigConfig] = useState(false)
  const [isAddingFocusConfigConfigConfig, setIsAddingFocusConfigConfigConfig] = useState(false)
  const [isAddingHideConfigConfigConfig, setIsAddingHideConfigConfigConfig] = useState(false)
  const [isAddingShowConfigConfigConfig, setIsAddingShowConfigConfigConfig] = useState(false)
  const [isAddingLockConfigConfigConfig, setIsAddingLockConfigConfigConfig] = useState(false)
  const [isAddingUnlockConfigConfigConfig, setIsAddingUnlockConfigConfigConfig] = useState(false)
  const [isAddingMoveUpConfigConfigConfig, setIsAddingMoveUpConfigConfigConfig] = useState(false)
  const [isAddingMoveDownConfigConfigConfig, setIsAddingMoveDownConfigConfigConfig] = useState(false)
  const [isAddingMoveLeftConfigConfigConfig, setIsAddingMoveLeftConfigConfigConfig] = useState(false)
  const [isAddingMoveRightConfigConfigConfig, setIsAddingMoveRightConfigConfigConfig] = useState(false)
  const [isAddingSaveConfigConfigConfig, setIsAddingSaveConfigConfigConfig] = useState(false)
  const [isAddingExportConfigConfigConfig, setIsAddingExportConfigConfigConfig] = useState(false)
  const [isAddingImportConfigConfigConfig, setIsAddingImportConfigConfigConfig] = useState(false)
  const [isAddingSettingsConfigConfigConfig, setIsAddingSettingsConfigConfigConfig] = useState(false)
  const [isAddingThemeConfigConfigConfig, setIsAddingThemeConfigConfigConfig] = useState(false)
  const [isAddingLayoutConfigConfigConfigConfigConfig, setIsAddingLayoutConfigConfigConfigConfigConfig] = useState(false)
  const [isAddingNodeStyleConfigConfigConfigConfig, setIsAddingNodeStyleConfigConfigConfigConfig] = useState(false)
  const [isAddingLinkStyleConfigConfigConfigConfig, setIsAddingLinkStyleConfigConfigConfigConfig] = useState(false)
  const [isAddingMindmapStyleConfigConfigConfigConfig, setIsAddingMindmapStyleConfigConfigConfigConfig] = useState(false)
  const [isAddingI18nConfigConfigConfigConfig, setIsAddingI18nConfigConfigConfigConfig] = useState(false)
  const [isAddingEventsConfigConfigConfigConfig, setIsAddingEventsConfigConfigConfigConfig] = useState(false)
  const [isAddingDataConfigConfigConfigConfig, setIsAddingDataConfigConfigConfigConfig] = useState(false)
  const [isAddingEditConfigConfigConfigConfig, setIsAddingEditConfigConfigConfigConfig] = useState(false)
  const [isAddingDeleteConfigConfigConfigConfig, setIsAddingDeleteConfigConfigConfigConfig] = useState(false)
  const [isAddingDuplicateConfigConfigConfigConfig, setIsAddingDuplicateConfigConfigConfigConfig] = useState(false)
  const [isAddingZoomInConfigConfigConfigConfig, setIsAddingZoomInConfigConfigConfigConfig] = useState(false)
  const [isAddingZoomOutConfigConfigConfigConfig, setIsAddingZoomOutConfigConfigConfigConfig] = useState(false)
  const [isAddingZoomResetConfigConfigConfigConfig, setIsAddingZoomResetConfigConfigConfigConfig] = useState(false)
  const [isAddingLayoutConfigConfigConfigConfigConfigConfig, setIsAddingLayoutConfigConfigConfigConfigConfigConfig] = useState(false)
  const [isAddingUndoConfigConfigConfigConfig, setIsAddingUndoConfigConfigConfigConfig] = useState(false)
  const [isAddingRedoConfigConfigConfigConfig, setIsAddingRedoConfigConfigConfigConfig] = useState(false)
  const [isAddingCopyConfigConfigConfigConfig, setIsAddingCopyConfigConfigConfigConfig] = useState(false)
  const [isAddingCutConfigConfigConfigConfig, setIsAddingCutConfigConfigConfigConfig] = useState(false)
  const [isAddingPasteConfigConfigConfigConfig, setIsAddingPasteConfigConfigConfigConfig] = useState(false)
  const [isAddingSelectAllConfigConfigConfigConfig, setIsAddingSelectAllConfigConfigConfigConfig] = useState(false)
  const [isAddingDeselectAllConfigConfigConfigConfig, setIsAddingDeselectAllConfigConfigConfigConfig] = useState(false)
  const [isAddingDeleteSelectedConfigConfigConfigConfig, setIsAddingDeleteSelectedConfigConfigConfigConfig] = useState(false)
  const [isAddingCollapseAllConfigConfigConfigConfig, setIsAddingCollapseAllConfigConfigConfigConfig] = useState(false)
  const [isAddingExpandAllConfigConfigConfigConfig, setIsAddingExpandAllConfigConfigConfigConfig] = useState(false)
  const [isAddingFocusConfigConfigConfigConfig, setIsAddingFocusConfigConfigConfigConfig] = useState(false)
  const [isAddingHideConfigConfigConfigConfig, setIsAddingHideConfigConfigConfigConfig] = useState(false)
  const [isAddingShowConfigConfigConfigConfig, setIsAddingShowConfigConfigConfigConfig] = useState(false)
  const [isAddingLockConfigConfigConfigConfig, setIsAddingLockConfigConfigConfigConfig] = useState(false)
  const [isAddingUnlockConfigConfigConfigConfig, setIsAddingUnlockConfigConfigConfigConfig] = useState(false)
  const [isAddingMoveUpConfigConfigConfigConfig, setIsAddingMoveUpConfigConfigConfigConfig] = useState(false)
  const [isAddingMoveDownConfigConfigConfigConfig, setIsAddingMoveDownConfigConfigConfigConfig] = useState(false)
  const [isAddingMoveLeftConfigConfigConfigConfig, setIsAddingMoveLeftConfigConfigConfigConfig] = useState(false)
  const [isAddingMoveRightConfigConfigConfigConfig, setIsAddingMoveRightConfigConfigConfigConfig] = useState(false)
  const [isAddingSaveConfigConfigConfigConfig, setIsAddingSaveConfigConfigConfigConfig] = useState(false)
  const [isAddingExportConfigConfigConfigConfig, setIsAddingExportConfigConfigConfigConfig] = useState(false)
  const [isAddingImportConfigConfigConfigConfig, setIsAddingImportConfigConfigConfigConfig] = useState(false)
  const [isAddingSettingsConfigConfigConfigConfig, setIsAddingSettingsConfigConfigConfigConfig] = useState(false)
  const [isAddingThemeConfigConfigConfigConfig, setIsAddingThemeConfigConfigConfigConfig] = useState(false)
  const [isAddingLayoutConfigConfigConfigConfigConfigConfig, setIsAddingLayoutConfigConfigConfigConfigConfigConfig] = useState(false)
