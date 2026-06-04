import { NextRequest } from 'next/server'
import { loadConfig } from '@/lib/config/loader'
import { errorResponse } from '@/lib/utils/apiError'

// Static locale dictionaries — extend to load from DB for per-app strings
const staticDictionaries: Record<string, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.settings':  'Settings',
    'nav.logout':    'Logout',
    'common.save':   'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit':   'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.loading':'Loading...',
    'common.error':  'Something went wrong',
    'common.noData': 'No data found',
    'auth.login':    'Sign In',
    'auth.register': 'Create Account',
    'auth.email':    'Email',
    'auth.password': 'Password',
    'auth.name':     'Full Name',
  },
  fr: {
    'nav.dashboard': 'Tableau de bord',
    'nav.settings':  'Paramètres',
    'nav.logout':    'Déconnexion',
    'common.save':   'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit':   'Modifier',
    'common.create': 'Créer',
    'common.search': 'Rechercher',
    'common.loading':'Chargement...',
    'common.error':  "Une erreur s'est produite",
    'common.noData': 'Aucune donnée trouvée',
    'auth.login':    'Se connecter',
    'auth.register': 'Créer un compte',
    'auth.email':    'E-mail',
    'auth.password': 'Mot de passe',
    'auth.name':     'Nom complet',
  },
  de: {
    'nav.dashboard': 'Dashboard',
    'nav.settings':  'Einstellungen',
    'nav.logout':    'Abmelden',
    'common.save':   'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit':   'Bearbeiten',
    'common.create': 'Erstellen',
    'common.search': 'Suchen',
    'common.loading':'Laden...',
    'common.error':  'Ein Fehler ist aufgetreten',
    'common.noData': 'Keine Daten gefunden',
    'auth.login':    'Anmelden',
    'auth.register': 'Konto erstellen',
    'auth.email':    'E-Mail',
    'auth.password': 'Passwort',
    'auth.name':     'Vollständiger Name',
  },
  es: {
    'nav.dashboard': 'Panel',
    'nav.settings':  'Configuración',
    'nav.logout':    'Cerrar sesión',
    'common.save':   'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit':   'Editar',
    'common.create': 'Crear',
    'common.search': 'Buscar',
    'common.loading':'Cargando...',
    'common.error':  'Algo salió mal',
    'common.noData': 'No se encontraron datos',
    'auth.login':    'Iniciar sesión',
    'auth.register': 'Crear cuenta',
    'auth.email':    'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.name':     'Nombre completo',
  },
}

export async function GET(request: NextRequest, ctx: RouteContext<'/api/i18n/[locale]'>) {
  try {
    const { locale } = await ctx.params
    const appId = request.headers.get('x-app-id') ?? request.nextUrl.searchParams.get('appId')

    // Get base static strings for locale (fallback to English)
    const base = staticDictionaries[locale] ?? staticDictionaries['en']

    if (!appId) {
      return Response.json({ locale, strings: base })
    }

    // If we have an appId, verify this locale is supported
    const { config } = await loadConfig(appId)
    const supported = config.i18n.supportedLocales.includes(locale)
    const effectiveLocale = supported ? locale : config.i18n.defaultLocale

    return Response.json({
      locale:    effectiveLocale,
      strings:   staticDictionaries[effectiveLocale] ?? staticDictionaries['en'],
      supported: config.i18n.supportedLocales,
      default:   config.i18n.defaultLocale,
    })
  } catch (err) {
    return errorResponse(err)
  }
}
