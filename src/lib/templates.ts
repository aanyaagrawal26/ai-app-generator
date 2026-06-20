/** Starter templates for the app generator wizard. Each `config` is a
 *  partial AppConfig (the wizard injects a fresh `id` before submitting)
 *  and validates against AppConfigSchema on the server. */

export interface Template {
  key: string
  name: string
  tagline: string
  /** lucide-react icon name */
  icon: string
  accent: string
  /** highlight chips shown on the card */
  highlights: string[]
  /** null = start from an empty config */
  config: Record<string, unknown> | null
}

export const TEMPLATES: Template[] = [
  {
    key: 'blank',
    name: 'Blank app',
    tagline: 'Start from an empty canvas and define everything yourself.',
    icon: 'Sparkles',
    accent: '#6366f1',
    highlights: ['No resources', 'Full control'],
    config: null,
  },
  {
    key: 'crm',
    name: 'CRM',
    tagline: 'Track contacts and deals with a searchable table.',
    icon: 'Users',
    accent: '#ec4899',
    highlights: ['Contacts', 'Deals', 'Pipeline'],
    config: {
      name: 'CRM',
      description: 'Track contacts and deals',
      resources: [
        {
          name: 'contacts', label: 'Contacts', timestamps: true,
          fields: [
            { name: 'name', type: 'text', label: 'Name', required: true },
            { name: 'email', type: 'email', label: 'Email', required: true },
            { name: 'company', type: 'text', label: 'Company' },
            { name: 'status', type: 'select', label: 'Status', options: ['lead', 'prospect', 'customer'], defaultValue: 'lead' },
          ],
        },
      ],
      pages: [
        { path: '/contacts', title: 'Contacts', components: [{ type: 'table', resource: 'contacts', config: { searchable: true } }] },
      ],
    },
  },
  {
    key: 'tasks',
    name: 'Task tracker',
    tagline: 'Organize work on a kanban board grouped by status.',
    icon: 'KanbanSquare',
    accent: '#8b5cf6',
    highlights: ['Kanban', 'Due dates', 'Priorities'],
    config: {
      name: 'Task Tracker',
      description: 'Organize tasks on a kanban board',
      resources: [
        {
          name: 'tasks', label: 'Tasks', timestamps: true,
          fields: [
            { name: 'title', type: 'text', label: 'Title', required: true },
            { name: 'status', type: 'select', label: 'Status', options: ['todo', 'in_progress', 'done'], defaultValue: 'todo' },
            { name: 'priority', type: 'select', label: 'Priority', options: ['low', 'medium', 'high'], defaultValue: 'medium' },
            { name: 'dueDate', type: 'date', label: 'Due date' },
          ],
        },
      ],
      pages: [
        { path: '/board', title: 'Board', components: [{ type: 'kanban', resource: 'tasks', config: { groupBy: 'status' } }] },
      ],
    },
  },
  {
    key: 'inventory',
    name: 'Inventory',
    tagline: 'Manage products with stock counts and value stats.',
    icon: 'Boxes',
    accent: '#06b6d4',
    highlights: ['Products', 'Stock', 'Stats'],
    config: {
      name: 'Inventory',
      description: 'Manage products and stock',
      resources: [
        {
          name: 'products', label: 'Products', timestamps: true,
          fields: [
            { name: 'name', type: 'text', label: 'Name', required: true },
            { name: 'sku', type: 'text', label: 'SKU', unique: true },
            { name: 'quantity', type: 'number', label: 'Quantity', defaultValue: 0 },
            { name: 'price', type: 'number', label: 'Price' },
          ],
        },
      ],
      pages: [
        {
          path: '/products', title: 'Products',
          components: [
            { type: 'stat', resource: 'products', config: { aggregate: 'count' } },
            { type: 'table', resource: 'products', config: { searchable: true } },
          ],
        },
      ],
    },
  },
]
