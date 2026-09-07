import { useState } from 'react'
import { Autocomplete, Card, Text, foldText, scoreMatch } from '@bfkk/bevel'

import { Demo, Stack } from './ui'

type District = { name: string; city: string }

const DISTRICTS: District[] = [
  { name: 'Şişli', city: 'İstanbul' },
  { name: 'Kadıköy', city: 'İstanbul' },
  { name: 'Beşiktaş', city: 'İstanbul' },
  { name: 'Üsküdar', city: 'İstanbul' },
  { name: 'Çankaya', city: 'Ankara' },
  { name: 'Keçiören', city: 'Ankara' },
  { name: 'Karşıyaka', city: 'İzmir' },
  { name: 'Bornova', city: 'İzmir' },
  { name: 'Muratpaşa', city: 'Antalya' },
]

export function AutocompleteDemo() {
  const [district, setDistrict] = useState('')
  const [plain, setPlain] = useState('')

  return (
    <Stack>
      <Demo
        title="Suggesting as you type"
        note="Matching folds accents and case away, so someone typing sisli on a keyboard they cannot be bothered to switch still finds Şişli. That is the opposite of what the casing helpers do - those keep the two Turkish i letters apart, because showing the wrong one is a spelling mistake.">
        <Autocomplete
          label="İlçe"
          placeholder="Aramak için yazın"
          value={district}
          onChangeText={setDistrict}
          options={DISTRICTS}
          toText={(item) => item.name}
          toDescription={(item) => item.city}
          onSelect={(item) => setDistrict(item.name)}
          emptyLabel="Eşleşme yok"
        />
        <Text variant="caption" color="textFaint">
          Try: sisli · kadikoy · uskudar · karsiyaka
        </Text>
      </Demo>

      <Demo
        title="Ordering"
        note="Four tiers, and the order between them is the point: an exact match, then something starting with the query, then a word inside it starting with the query, then a match buried anywhere. A list sorted by mere contains puts the thing typed in full somewhere down the page. Equal matches keep the order they arrived in, so a list already ordered by something meaningful does not reshuffle on every keystroke.">
        <Card gap={4}>
          <Text variant="caption" color="textMuted">{`scoreMatch('Ankara', 'ankara') = ${scoreMatch('Ankara', 'ankara')}`}</Text>
          <Text variant="caption" color="textMuted">{`scoreMatch('Ankara Cankaya', 'ankara') = ${scoreMatch('Ankara Cankaya', 'ankara')}`}</Text>
          <Text variant="caption" color="textMuted">{`scoreMatch('Buyuk Ankara', 'ankara') = ${scoreMatch('Buyuk Ankara', 'ankara')}`}</Text>
          <Text variant="caption" color="textMuted">{`scoreMatch('Sankara', 'ankara') = ${scoreMatch('Sankara', 'ankara')}`}</Text>
          <Text variant="caption" color="textFaint">{`foldText('Şişli') = ${foldText('Şişli')}   foldText('IŞIK') = ${foldText('IŞIK')}`}</Text>
        </Card>
      </Demo>

      <Demo
        title="Everything when empty"
        note="The list is drawn inline, below the field, rather than floating over the screen. A floating list has to be measured, flipped and clamped, and it covers the very form being filled in.">
        <Autocomplete
          label="Şehir"
          placeholder="Odaklan ve gör"
          value={plain}
          onChangeText={setPlain}
          options={['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Adana']}
          toText={(item) => item}
          onSelect={setPlain}
          showAllWhenEmpty
          limit={4}
        />
      </Demo>
    </Stack>
  )
}
