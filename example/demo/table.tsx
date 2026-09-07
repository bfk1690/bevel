import { Badge, Card, Table, Text, Timeline, toast, useTheme } from '@bfkk/bevel'

import { Demo, Stack } from './ui'

type Order = { id: string; customer: string; city: string; items: number; total: string; state: string }

const ORDERS: Order[] = [
  { id: 'HJ-88421', customer: 'Ada Lovelace', city: 'Istanbul', items: 3, total: '1.169,90', state: 'on the way' },
  { id: 'HJ-88420', customer: 'Grace Hopper', city: 'Ankara', items: 1, total: '249,00', state: 'packed' },
  { id: 'HJ-88418', customer: 'Alan Turing', city: 'Izmir', items: 7, total: '3.480,50', state: 'delivered' },
  { id: 'HJ-88415', customer: 'Katherine Johnson', city: 'Bursa', items: 2, total: '712,25', state: 'delivered' },
]

/** Packed comes after placed, delivered after both - not what the words say */
const STATE_ORDER = ['on the way', 'packed', 'delivered']

export function TableDemo() {
  const { space } = useTheme()

  return (
    <Stack>
      <Demo
        title="Fitting columns"
        note="A column is never squeezed below its minimum. One pressed down to fit is unreadable in a way that scrolling sideways never is.">
        <Card padding={space(3)}>
          <Table
            columns={[
              { key: 'city', title: 'City', value: (row) => row.city, sortable: true },
              {
                key: 'items',
                title: 'Items',
                width: 64,
                align: 'right',
                value: (row) => String(row.items),
                sortable: true,
              },
              { key: 'total', title: 'Total', width: 96, align: 'right', value: (row) => row.total },
            ]}
            data={ORDERS}
            keyExtractor={(row) => row.id}
          />
        </Card>
      </Demo>

      <Demo
        title="Sorting"
        note="Press a header: ascending, then descending, then off. The third press is the one people expect and almost nobody implements - without it there is no way back to the order the data arrived in, which is itself meaningful. Numbers inside text sort as numbers, so HJ-9 comes before HJ-10.">
        <Card padding={space(3)}>
          <Table
            columns={[
              { key: 'id', title: 'Order', width: 110, value: (row) => row.id, sortable: true },
              { key: 'customer', title: 'Customer', value: (row) => row.customer, sortable: true },
              {
                key: 'state',
                title: 'State',
                width: 110,
                sortable: true,
                value: (row) => row.state,
                // An order nothing about the words themselves would give
                compare: (a, b) => STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state),
                render: (row) => (
                  <Badge
                    label={row.state}
                    tone={row.state === 'delivered' ? 'ok' : row.state === 'packed' ? 'warning' : 'accent'}
                  />
                ),
              },
            ]}
            data={ORDERS}
            keyExtractor={(row) => row.id}
            defaultSort={{ key: 'id', direction: 'desc' }}
          />
        </Card>
      </Demo>

      <Demo
        title="Sideways, with the first column pinned"
        note="Worth it when that column is what identifies the row: scrolling away from the name leaves a wall of numbers belonging to nobody.">
        <Card padding={space(3)}>
          <Table
            stickyFirstColumn
            onRowPress={(row) => toast.info(row.id)}
            columns={[
              { key: 'customer', title: 'Customer', width: 130, value: (row) => row.customer, sortable: true },
              { key: 'id', title: 'Order', width: 110, value: (row) => row.id },
              { key: 'city', title: 'City', width: 100, value: (row) => row.city },
              { key: 'items', title: 'Items', width: 70, align: 'right', value: (row) => String(row.items) },
              { key: 'total', title: 'Total', width: 110, align: 'right', value: (row) => row.total, sortable: true },
              {
                key: 'state',
                title: 'State',
                width: 120,
                render: (row) => (
                  <Badge
                    label={row.state}
                    tone={row.state === 'delivered' ? 'ok' : row.state === 'packed' ? 'warning' : 'accent'}
                  />
                ),
              },
            ]}
            data={ORDERS}
            keyExtractor={(row) => row.id}
          />
        </Card>
      </Demo>

      <Demo title="Empty">
        <Card padding={space(3)}>
          <Table
            columns={[{ key: 'a', title: 'Column', value: () => '' }]}
            data={[]}
            emptyLabel="No orders in this range"
          />
        </Card>
      </Demo>

      <Demo
        title="Timeline"
        note="The line is drawn between entries rather than beside each one, so nothing hangs below the last. The marker is centred on the first line of the entry rather than pinned to the top of the rail - a 10pt dot at the top of a 21pt line sits visibly high, and a row of them never quite lines up with what it marks.">
        <Card>
          <Timeline
            entries={[
              { key: 'placed', meta: '4 Sept, 16:20', title: 'Order placed', description: 'Payment authorised.' },
              { key: 'packed', meta: '4 Sept, 18:02', title: 'Packed', tone: 'ok' },
              { key: 'way', meta: 'Today, 09:15', title: 'On the way', description: 'Courier: Mehmet K.' },
              { key: 'delivery', title: 'Delivery', description: 'Expected before 18:00.', pending: true },
            ]}
          />
        </Card>
      </Demo>

      <Demo title="Steps">
        <Card>
          <Timeline
            entries={[
              { key: '1', title: 'Account', description: 'Done', tone: 'ok' },
              { key: '2', title: 'Address', description: 'You are here' },
              { key: '3', title: 'Payment', pending: true },
              { key: '4', title: 'Confirm', pending: true },
            ]}
          />
        </Card>
      </Demo>
    </Stack>
  )
}
