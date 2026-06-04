import type React from 'react'
import TableComponent    from '@/components/ui-components/TableComponent'
import FormComponent     from '@/components/ui-components/FormComponent'
import StatComponent     from '@/components/ui-components/StatComponent'
import ChartComponent    from '@/components/ui-components/ChartComponent'
import KanbanComponent   from '@/components/ui-components/KanbanComponent'
import CardComponent     from '@/components/ui-components/CardComponent'
import TabsComponent     from '@/components/ui-components/TabsComponent'
import DetailComponent   from '@/components/ui-components/DetailComponent'
import CalendarComponent from '@/components/ui-components/CalendarComponent'
import ModalComponent    from '@/components/ui-components/ModalComponent'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentRegistry: Record<string, React.ComponentType<any>> = {
  table:    TableComponent,
  form:     FormComponent,
  stat:     StatComponent,
  chart:    ChartComponent,
  kanban:   KanbanComponent,
  card:     CardComponent,
  tabs:     TabsComponent,
  detail:   DetailComponent,
  calendar: CalendarComponent,
  modal:    ModalComponent,
}
