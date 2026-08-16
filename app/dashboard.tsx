import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MyCarrierCard,
  MyShipmentCard,
  ShipmentListingCard,
} from '../components/listings';
import { PostShipmentForm, ShipmentFormState, shipmentToForm } from '../components/PostShipmentForm';
import { PlaceAutocomplete, PlaceValue } from '../components/PlaceAutocomplete';
import { SettingsPanel } from '../components/SettingsPanel';
import { ValidationHints, ValidationMessage } from '../components/ValidationHints';
import {
  AppShell,
  Banner,
  BottomNav,
  Button,
  EmptyState,
  FilterChips,
  GlowBackground,
  Input,
  listContentStyle,
  LoadingScreen,
  ModalSheet,
  SearchBar,
  SignOutConfirm,
  Toast,
  TopBar,
  ContactActions,
} from '../components/ui';
import {
  api,
  CarrierListing,
  InterestRecord,
  MyInterestRecord,
  Shipment,
  User,
} from '../lib/api';
import { clearToken, getToken } from '../lib/storage';
import { formatStatus, itemIcon, milesToKm } from '../lib/format';
import { billingHref, locationSetupHref } from '../lib/authFlow';
import { coordsFromUser, userHasLocation, type BrowseCoords } from '../lib/userLocation';
import {
  readCurrentCoords,
  requestAppLocationPermission,
} from '../lib/locationPermission';
import { colors, spacing } from '../lib/theme';
import { useToast } from '../lib/useToast';

type Tab = 'browse' | 'mine' | 'create' | 'settings';
type CarrierMineSubTab = 'past' | 'contacted';

const CARRIER_FIELDS = [
  { key: 'vehicleType', label: 'Vehicle type', placeholder: 'e.g. Tempo, Truck', icon: '🚛' },
  { key: 'availability', label: 'Availability', placeholder: 'e.g. Weekdays', icon: '📅' },
  { key: 'price', label: 'Rate (USD)', placeholder: '450', keyboard: 'numeric' as const, icon: '$' },
  { key: 'notes', label: 'Notes (optional)', placeholder: 'Capacity, restrictions', icon: '📝' },
];

const FILTER_CHIPS = ['All', 'Nearby', 'Parcel', 'Furniture', 'Vehicles', 'Appliances'];

function tabTitle(tab: Tab, isCarrier: boolean, editingShipment: boolean) {
  if (tab === 'browse') return isCarrier ? 'Browse Shipments' : 'My Dashboard';
  if (tab === 'mine') return 'My Posts';
  if (tab === 'settings') return 'Settings';
  if (editingShipment) return 'Edit Shipment';
  return isCarrier ? 'Post Availability' : 'Post Shipment';
}

export default function DashboardScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>('mine');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [myShipments, setMyShipments] = useState<Shipment[]>([]);
  const [myListings, setMyListings] = useState<CarrierListing[]>([]);
  const [myInterests, setMyInterests] = useState<MyInterestRecord[]>([]);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [carrierMineSubTab, setCarrierMineSubTab] = useState<CarrierMineSubTab>('past');
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast, notify, dismiss } = useToast();

  const [interests, setInterests] = useState<InterestRecord[]>([]);
  const [interestModal, setInterestModal] = useState(false);
  const [interestShipmentId, setInterestShipmentId] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; name: string } | null>(null);
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [browseCoords, setBrowseCoords] = useState<BrowseCoords | null>(null);
  const [browseSource, setBrowseSource] = useState<'profile' | 'gps'>('profile');
  const [gpsLoading, setGpsLoading] = useState(false);
  const locationPromptedRef = useRef(false);
  const sessionReadyRef = useRef(false);

  const [filters, setFilters] = useState({
    itemType: '', location: '', maxDistanceMi: '50',
  });
  const [carrierForm, setCarrierForm] = useState({
    vehicleType: '', availability: '', price: '', notes: '',
  });
  const [serviceAreaPlace, setServiceAreaPlace] = useState<PlaceValue>({ address: '' });

  const loadBrowse = useCallback(async (currentUser: User) => {
    if (currentUser.role !== 'carrier') return;

    const activeCoords = browseCoords ?? coordsFromUser(currentUser);
    const distanceQuery = activeCoords
      ? {
          lat: String(activeCoords.lat),
          lng: String(activeCoords.lng),
          maxDistanceKm: filters.maxDistanceMi
            ? String(milesToKm(Number(filters.maxDistanceMi)))
            : String(milesToKm(50)),
        }
      : {};

    const data = await api.getShipments({
      itemType: filters.itemType || undefined,
      location: filters.location || undefined,
      ...distanceQuery,
    });
    setShipments(data);
  }, [filters, browseCoords]);

  const loadData = useCallback(async (accessToken: string, currentUser: User) => {
    if (currentUser.role === 'admin' || currentUser.role === 'super_admin') return;
    await loadBrowse(currentUser);
    if (currentUser.role === 'shipper') {
      setMyShipments(await api.getMyShipments(accessToken));
    }
    if (currentUser.role === 'carrier') {
      const [listings, interests] = await Promise.all([
        api.getMyCarrierListings(accessToken),
        api.getMyInterests(accessToken),
      ]);
      setMyListings(listings);
      setMyInterests(interests);
    }
  }, [loadBrowse]);

  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;

  useEffect(() => {
    let active = true;
    getToken().then(async (accessToken) => {
      if (!accessToken) { router.replace('/'); return; }
      try {
        const me = await api.me(accessToken);
        if (!active) return;
        if (me.role !== 'admin' && !me.subscriptionActive) {
          router.replace(billingHref());
          return;
        }
        if (me.role !== 'admin' && me.role !== 'super_admin' && !userHasLocation(me)) {
          router.replace(locationSetupHref());
          return;
        }
        setToken(accessToken);
        setUser(me);
        setBrowseCoords((prev) => prev ?? coordsFromUser(me));
        if (!sessionReadyRef.current) {
          setTab(me.role === 'carrier' ? 'browse' : 'mine');
          sessionReadyRef.current = true;
        }
        await loadDataRef.current(accessToken, me);
      } catch {
        if (!active) return;
        await clearToken();
        router.replace('/');
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!user || locationPromptedRef.current) return;
    locationPromptedRef.current = true;
    void (async () => {
      const permission = await requestAppLocationPermission();
      if (!permission.granted) return;
      const coords = await readCurrentCoords();
      if (coords) {
        setBrowseCoords(coords);
        setBrowseSource('gps');
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user || tab !== 'browse') return;
    loadBrowse(user).catch(() => {});
  }, [user, tab, browseCoords, filters, loadBrowse]);

  useEffect(() => {
    if (!token || tab !== 'settings') return;
    api.me(token).then(setUser).catch(() => {});
  }, [token, tab]);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      void (async () => {
        try {
          const me = await api.me(token);
          setUser(me);
          if (me.role === 'carrier') {
            setMyInterests(await api.getMyInterests(token));
          }
          if (me.role === 'shipper') {
            setMyShipments(await api.getMyShipments(token));
          }
        } catch {
          /* session may have expired */
        }
      })();
    }, [token]),
  );

  async function useGpsForBrowse() {
    setGpsLoading(true);
    try {
      const permission = await requestAppLocationPermission();
      if (!permission.granted) {
        notify('Location permission denied.', 'error');
        return;
      }
      const coords = await readCurrentCoords();
      if (!coords) {
        notify('Could not read GPS.', 'error');
        return;
      }
      setBrowseCoords(coords);
      setBrowseSource('gps');
      notify('Showing listings near your current location.', 'success');
    } catch {
      notify('Could not read GPS.', 'error');
    } finally {
      setGpsLoading(false);
    }
  }

  function resetBrowseToProfile() {
    if (!user) return;
    const coords = coordsFromUser(user);
    setBrowseCoords(coords);
    setBrowseSource('profile');
  }

  const filteredShipments = useMemo(() => {
    let list = shipments;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.itemType.toLowerCase().includes(q) ||
          (s.itemName?.toLowerCase().includes(q) ?? false) ||
          s.pickupLocation.toLowerCase().includes(q) ||
          s.dropLocation.toLowerCase().includes(q),
      );
    }
    if (chip === 'Nearby') list = list.filter((s) => s.distanceKm != null && s.distanceKm <= 25);
    if (chip === 'Parcel') list = list.filter((s) => /parcel|package|box|courier/i.test(s.itemType + (s.notes ?? '') + (s.itemName ?? '')));
    if (chip === 'Furniture') list = list.filter((s) => /furniture|office|table|desk/i.test(s.itemType + (s.notes ?? '')));
    if (chip === 'Vehicles') list = list.filter((s) => /motor|bike|vehicle|car/i.test(s.itemType + (s.notes ?? '')));
    if (chip === 'Appliances') list = list.filter((s) => /fridge|refrigerator|appliance|ac|washing/i.test(s.itemType + (s.notes ?? '')));
    return list;
  }, [shipments, search, chip]);

  const contactedShipments = useMemo(
    () =>
      myInterests
        .filter((item) => item.listingType === 'shipment' && item.listing)
        .map((item) => item.listing as Shipment),
    [myInterests],
  );

  const interestedShipmentIds = useMemo(
    () =>
      new Set(
        myInterests
          .filter((item) => item.listingType === 'shipment')
          .map((item) => String(item.listingId)),
      ),
    [myInterests],
  );

  async function performLogout() {
    await clearToken();
    router.replace('/');
  }

  async function handleExpressInterest(listingId: string) {
    if (!token || !user?.subscriptionActive) {
      notify('Active subscription required.', 'error');
      router.push(billingHref());
      return;
    }
    if (interestedShipmentIds.has(listingId)) return;
    try {
      await api.expressInterest(token, { listingType: 'shipment', listingId });
      setMyInterests(await api.getMyInterests(token));
      notify('Interest sent successfully!', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to express interest', 'error');
    }
  }

  async function showInterests(listingType: 'shipment' | 'carrier', listingId: string) {
    if (!token) return;
    const data = listingType === 'shipment'
      ? await api.getShipmentInterests(token, listingId)
      : await api.getCarrierInterests(token, listingId);
    setInterests(data);
    setInterestShipmentId(listingType === 'shipment' ? listingId : null);
    setInterestModal(true);
  }

  function openCarrierProfile(carrierId: string) {
    setInterestModal(false);
    const query = interestShipmentId ? `?shipmentId=${interestShipmentId}` : '';
    router.push(`/carrier/${carrierId}${query}`);
  }

  async function handleCreateShipment(form: ShipmentFormState) {
    if (!token || !user?.subscriptionActive) {
      notify('Active subscription required.', 'error');
      router.push(billingHref());
      return;
    }
    setSubmitting(true);
    try {
      if (
        form.pickup.lat == null ||
        form.pickup.lng == null ||
        form.drop.lat == null ||
        form.drop.lng == null
      ) {
        notify('Select pickup and drop from address suggestions.', 'error');
        return;
      }
      await api.createShipment(token, {
        itemName: form.itemName.trim(),
        itemType: form.itemType,
        pickupLocation: form.pickup.address.trim(),
        pickupLocationDetails: form.pickup.details?.trim() || undefined,
        dropLocation: form.drop.address.trim(),
        dropLocationDetails: form.drop.details?.trim() || undefined,
        price: Number(form.price),
        notes: form.notes.trim() || undefined,
        photos: form.photos.length ? form.photos : undefined,
        quantity: form.quantity ? Number(form.quantity) : 1,
        weightLbs: form.weightLbs ? Number(form.weightLbs) : undefined,
        dimensions: form.dimensions.trim() || undefined,
        fragile: form.fragile,
        preferredPickupDate: form.preferredPickupDate.trim() || undefined,
        pickupLat: form.pickup.lat,
        pickupLng: form.pickup.lng,
        dropLat: form.drop.lat,
        dropLng: form.drop.lng,
        pickupPlaceId: form.pickup.placeId,
        dropPlaceId: form.drop.placeId,
      });
      if (user) await loadData(token, user);
      setTab('mine');
      notify('Shipment posted successfully!', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to post shipment', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateShipment(form: ShipmentFormState) {
    if (!token || !user?.subscriptionActive || !editingShipment) {
      notify('Active subscription required.', 'error');
      router.push(billingHref());
      return;
    }
    setSubmitting(true);
    try {
      if (
        form.pickup.lat == null ||
        form.pickup.lng == null ||
        form.drop.lat == null ||
        form.drop.lng == null
      ) {
        notify('Select pickup and drop from address suggestions.', 'error');
        return;
      }
      await api.updateShipment(token, editingShipment._id, {
        itemName: form.itemName.trim(),
        itemType: form.itemType,
        pickupLocation: form.pickup.address.trim(),
        pickupLocationDetails: form.pickup.details?.trim() || undefined,
        dropLocation: form.drop.address.trim(),
        dropLocationDetails: form.drop.details?.trim() || undefined,
        price: Number(form.price),
        notes: form.notes.trim() || undefined,
        photos: form.photos.length ? form.photos : undefined,
        quantity: form.quantity ? Number(form.quantity) : 1,
        weightLbs: form.weightLbs ? Number(form.weightLbs) : undefined,
        dimensions: form.dimensions.trim() || undefined,
        fragile: form.fragile,
        preferredPickupDate: form.preferredPickupDate.trim() || undefined,
        pickupLat: form.pickup.lat,
        pickupLng: form.pickup.lng,
        dropLat: form.drop.lat,
        dropLng: form.drop.lng,
        pickupPlaceId: form.pickup.placeId,
        dropPlaceId: form.drop.placeId,
      });
      setEditingShipment(null);
      if (user) await loadData(token, user);
      setTab('mine');
      notify('Shipment updated successfully!', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update shipment', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function startEditShipment(shipment: Shipment) {
    setEditingShipment(shipment);
    setTab('create');
  }

  function cancelEditShipment() {
    setEditingShipment(null);
    setTab('mine');
    notify('Edit cancelled.', 'info');
  }

  function handleTabChange(nextTab: Tab) {
    if (user?.role !== 'carrier' && nextTab === 'browse') {
      setTab('mine');
      return;
    }
    if (nextTab !== 'create') setEditingShipment(null);
    setTab(nextTab);
  }

  async function handleCreateCarrierListing() {
    if (!token || !user?.subscriptionActive) {
      notify('Active subscription required.', 'error');
      router.push(billingHref());
      return;
    }
    if (
      serviceAreaPlace.lat == null ||
      serviceAreaPlace.lng == null ||
      !serviceAreaPlace.address.trim()
    ) {
      notify('Select service area from address suggestions.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.createCarrierListing(token, {
        vehicleType: carrierForm.vehicleType,
        serviceArea: serviceAreaPlace.address.trim(),
        serviceAreaLat: serviceAreaPlace.lat,
        serviceAreaLng: serviceAreaPlace.lng,
        serviceAreaPlaceId: serviceAreaPlace.placeId,
        availability: carrierForm.availability,
        price: Number(carrierForm.price),
        notes: carrierForm.notes.trim() || undefined,
      });
      setCarrierForm({ vehicleType: '', availability: '', price: '', notes: '' });
      setServiceAreaPlace({ address: '' });
      if (user) await loadData(token, user);
      setTab('mine');
      notify('Listing posted successfully!', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to post listing', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReview() {
    if (!token || !reviewTarget) return;
    try {
      await api.createReview(token, {
        revieweeId: reviewTarget.id,
        rating: Number(reviewRating),
        comment: reviewComment || undefined,
      });
      setReviewModal(false);
      setReviewComment('');
      notify(`Review submitted for ${reviewTarget.name}.`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Review failed', 'error');
    }
  }

  async function refreshSubscription() {
    if (!token) return;
    setSubmitting(true);
    try {
      const me = await api.me(token);
      setUser(me);
      if (me.subscriptionActive) {
        notify('Subscription is now active!', 'success');
      } else {
        notify('Subscription is still inactive.', 'info');
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not refresh status', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleActivateSubscription() {
    if (!token || !user?.subscriptionPlan) return;
    setSubmitting(true);
    try {
      const checkout = await api.createCheckout(token, user.subscriptionPlan);
      if (checkout.mock) {
        const me = await api.me(token);
        setUser(me);
        notify('Subscription activated successfully!', 'success');
        return;
      }
      if (checkout.url) {
        await Linking.openURL(checkout.url);
        notify('Complete payment in the browser, then tap Refresh plan status.', 'info');
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Payment failed', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: string, status: 'open' | 'in_progress' | 'closed') {
    if (!token || !user) return;
    try {
      await api.updateShipmentStatus(token, id, status);
      await loadData(token, user);
      notify(`Status updated to ${formatStatus(status)}.`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update status', 'error');
    }
  }

  async function applyFilters() {
    if (user) await loadBrowse(user);
    setFiltersOpen(false);
    notify('Filters applied.', 'success');
  }

  async function handlePayNow() {
    router.push(billingHref());
  }

  if (loading || !user) return <LoadingScreen />;

  if (user.role === 'admin' || user.role === 'super_admin') {
    return (
      <SafeAreaView style={styles.screen}>
        <GlowBackground />
        <View style={styles.adminWrap}>
          <Text style={styles.adminTitle}>Super Admin account</Text>
          <Text style={styles.adminSubtitle}>Use the web admin dashboard for full platform access.</Text>
          <Button title="Sign out" onPress={() => setSignOutOpen(true)} variant="secondary" />
        </View>
        <SignOutConfirm
          visible={signOutOpen}
          onCancel={() => setSignOutOpen(false)}
          onConfirm={() => {
            setSignOutOpen(false);
            void performLogout();
          }}
        />
      </SafeAreaView>
    );
  }

  const isCarrier = user.role === 'carrier';
  const browseCount = filteredShipments.length;

  const browseHeader = (
    <View style={styles.browseHeader}>
      {!user.subscriptionActive && (
        <Banner
          tone="warning"
          message="Subscription inactive — activate to post listings and express interest."
          action={
            <View style={styles.bannerActions}>
              <Button title="Activate" onPress={handlePayNow} compact />
              <Button title="Refresh" onPress={refreshSubscription} variant="secondary" compact />
            </View>
          }
        />
      )}

      <View style={styles.countRow}>
        <Text style={styles.countText}>{browseCount} available</Text>
        {(browseCoords ?? coordsFromUser(user)) ? (
          <Text style={styles.countHint}>
            {browseSource === 'gps' ? 'Near you (GPS)' : 'Near your profile'}
          </Text>
        ) : null}
      </View>

      <View style={styles.locationRow}>
        <Button
          title={gpsLoading ? 'GPS...' : 'Use current location'}
          onPress={useGpsForBrowse}
          variant="secondary"
          compact
          loading={gpsLoading}
        />
        {browseSource === 'gps' ? (
          <Button title="Use profile" onPress={resetBrowseToProfile} variant="ghost" compact />
        ) : null}
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search shipments..."
      />
      <FilterChips options={FILTER_CHIPS} selected={chip} onSelect={setChip} />

      {user.subscriptionActive && (
        <Button
          title={filtersOpen ? 'Hide filters' : 'Distance filters'}
          onPress={() => setFiltersOpen(!filtersOpen)}
          variant="ghost"
          compact
        />
      )}

      {filtersOpen && (
        <View style={styles.filterForm}>
          <Input
            label="Item type"
            placeholder="Filter by type"
            value={filters.itemType}
            onChangeText={(v) => setFilters({ ...filters, itemType: v })}
          />
          <Input
            label="Location text"
            placeholder="City or area"
            value={filters.location}
            onChangeText={(v) => setFilters({ ...filters, location: v })}
          />
          <Input
            label="Max distance (mi)"
            placeholder="50"
            keyboardType="numeric"
            value={filters.maxDistanceMi}
            onChangeText={(v) => setFilters({ ...filters, maxDistanceMi: v })}
          />
          <Button title="Apply filters" onPress={applyFilters} compact />
        </View>
      )}
    </View>
  );

  return (
    <AppShell
      header={
        <TopBar
          title={tabTitle(tab, isCarrier, !!editingShipment)}
          name={user.name}
          role={user.role}
          subscriptionActive={user.subscriptionActive}
          profilePhotoUrl={user.profilePhotoUrl}
          onAvatarPress={() => router.push('/profile')}
          onLogout={performLogout}
        />
      }
      footer={
        <BottomNav
          tabs={
            isCarrier
              ? [
                  { key: 'browse', label: 'Browse', icon: '📦' },
                  { key: 'mine', label: 'My Posts', icon: '🚛' },
                  { key: 'create', label: 'Post', icon: '➕' },
                  { key: 'settings', label: 'Settings', icon: '⚙️' },
                ]
              : [
                  { key: 'mine', label: 'My Posts', icon: '📋' },
                  { key: 'create', label: 'Post', icon: '➕' },
                  { key: 'settings', label: 'Settings', icon: '⚙️' },
                ]
          }
          active={tab}
          onChange={handleTabChange}
        />
      }
    >
      {toast && (
        <View style={styles.toastWrap}>
          <Toast message={toast.text} tone={toast.tone} onDismiss={dismiss} />
        </View>
      )}

      {tab === 'browse' && isCarrier && (
        <FlatList
          style={styles.flexList}
          data={filteredShipments}
          keyExtractor={(item) => item._id}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={browseHeader}
          ListEmptyComponent={
            <EmptyState icon="🔍" title="No matches" subtitle="Try a different search or filter." />
          }
          renderItem={({ item }) => (
            <ShipmentListingCard
              shipment={item}
              subscriptionActive={user.subscriptionActive}
              onView={() => router.push(`/shipment/${item._id}`)}
              onInterested={() => handleExpressInterest(item._id)}
              showInterested
              alreadyInterested={interestedShipmentIds.has(String(item._id))}
            />
          )}
        />
      )}

      {tab === 'mine' && (
        <ScrollView
          style={styles.flexList}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
        >
          {isCarrier && (
            <FilterChips
              options={['Past Work', 'Contacted']}
              selected={carrierMineSubTab === 'past' ? 'Past Work' : 'Contacted'}
              onSelect={(value) => setCarrierMineSubTab(value === 'Past Work' ? 'past' : 'contacted')}
            />
          )}

          {isCarrier && carrierMineSubTab === 'past' && myListings.length === 0 && (
            <EmptyState
              icon="📋"
              title="No listings yet"
              subtitle="Post your vehicle availability to get discovered."
              action={<Button title="Create listing" onPress={() => handleTabChange('create')} compact />}
            />
          )}
          {isCarrier && carrierMineSubTab === 'contacted' && contactedShipments.length === 0 && (
            <EmptyState
              icon="📦"
              title="No contacted shipments"
              subtitle="Browse shipments and tap Interested to contact shippers."
              action={<Button title="Browse shipments" onPress={() => handleTabChange('browse')} compact />}
            />
          )}
          {!isCarrier && myShipments.length === 0 && (
            <EmptyState
              icon="📦"
              title="No posts yet"
              subtitle="Post what you need moved."
              action={<Button title="Post shipment" onPress={() => handleTabChange('create')} compact />}
            />
          )}
          {!isCarrier && myShipments.map((item) => (
            <MyShipmentCard
              key={item._id}
              shipment={item}
              onStatusChange={(status) => updateStatus(item._id, status)}
              onViewInterests={() => showInterests('shipment', item._id)}
              onEdit={() => startEditShipment(item)}
              onViewAssignedCarrier={(carrierId) => router.push(`/carrier/${carrierId}`)}
            />
          ))}
          {isCarrier && carrierMineSubTab === 'past' && myListings.map((item) => (
            <MyCarrierCard
              key={item._id}
              listing={item}
              onViewInterests={() => showInterests('carrier', item._id)}
            />
          ))}
          {isCarrier && carrierMineSubTab === 'contacted' && contactedShipments.map((item) => (
            <ShipmentListingCard
              key={item._id}
              shipment={item}
              subscriptionActive={user.subscriptionActive}
              onView={() => router.push(`/shipment/${item._id}`)}
              onInterested={() => {}}
              showInterested={false}
              showShipperContact
            />
          ))}
        </ScrollView>
      )}

      {tab === 'create' && !isCarrier && token && (
        <ScrollView
          style={styles.flexList}
          contentContainerStyle={listContentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!user.subscriptionActive ? (
            <ValidationMessage
              tone="warning"
              message="Subscription inactive. Activate in Settings before you can publish a shipment."
            />
          ) : null}
          <PostShipmentForm
            key={editingShipment?._id ?? 'create'}
            token={token}
            submitting={submitting}
            initial={editingShipment ? shipmentToForm(editingShipment) : undefined}
            mode={editingShipment ? 'edit' : 'create'}
            onSubmit={editingShipment ? handleUpdateShipment : handleCreateShipment}
            onCancel={editingShipment ? cancelEditShipment : undefined}
            onNotify={notify}
          />
        </ScrollView>
      )}

      {tab === 'create' && isCarrier && (
        <ScrollView
          style={styles.flexList}
          contentContainerStyle={listContentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!user.subscriptionActive ? (
            <ValidationMessage
              tone="warning"
              message="Subscription inactive. Activate in Settings before you can publish a vehicle listing."
            />
          ) : null}
          {CARRIER_FIELDS.map(({ key, label, placeholder, keyboard, icon }) => (
            <Input
              key={key}
              label={label}
              icon={icon}
              placeholder={placeholder}
              keyboardType={keyboard}
              value={carrierForm[key as keyof typeof carrierForm]}
              onChangeText={(text) => setCarrierForm({ ...carrierForm, [key]: text })}
            />
          ))}
          {token ? (
            <PlaceAutocomplete
              label="Service area"
              placeholder="Search operating area"
              icon="📍"
              token={token}
              value={serviceAreaPlace}
              onChange={setServiceAreaPlace}
              required
            />
          ) : null}
          {(() => {
            const serviceAreaReady =
              serviceAreaPlace.address.trim().length > 0 &&
              serviceAreaPlace.lat != null &&
              serviceAreaPlace.lng != null;
            const carrierListingReady =
              Boolean(carrierForm.vehicleType.trim()) &&
              serviceAreaReady &&
              Boolean(carrierForm.availability.trim()) &&
              Boolean(carrierForm.price.trim());
            return (
              <>
                {!carrierListingReady ? (
                  <ValidationHints
                    title="Complete these to publish:"
                    items={[
                      { label: 'Vehicle type entered', ok: Boolean(carrierForm.vehicleType.trim()) },
                      { label: 'Service area selected from suggestions', ok: serviceAreaReady },
                      { label: 'Availability entered', ok: Boolean(carrierForm.availability.trim()) },
                      { label: 'Price entered', ok: Boolean(carrierForm.price.trim()) },
                    ]}
                  />
                ) : null}
                <Button
                  title="Publish listing"
                  onPress={handleCreateCarrierListing}
                  loading={submitting}
                  disabled={!carrierListingReady || !user.subscriptionActive}
                />
              </>
            );
          })()}
        </ScrollView>
      )}

      {tab === 'settings' && (
        <ScrollView
          style={styles.flexList}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
        >
          <SettingsPanel
            user={user}
            token={token!}
            submitting={submitting}
            onEditProfile={() => router.push('/profile')}
            onActivate={handleActivateSubscription}
            onRefresh={refreshSubscription}
            onNotify={notify}
          />
        </ScrollView>
      )}

      <ModalSheet
        visible={interestModal}
        title={interestShipmentId ? 'Interested carriers' : 'Interested users'}
        onClose={() => {
          setInterestModal(false);
          setInterestShipmentId(null);
        }}
      >
        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          {interestShipmentId && user.role === 'shipper' ? (
            <ValidationMessage
              tone="info"
              message="Review each carrier, call or WhatsApp them directly, then assign manually only when you are satisfied. Carriers are never auto-assigned."
            />
          ) : null}
          {interests.length === 0 && (
            <EmptyState
              icon="👋"
              title="No interests yet"
              subtitle={interestShipmentId ? 'Carriers will appear here when they tap Interested.' : 'Share your listing to attract more users.'}
            />
          )}
          {interests.map((item) => {
            const carrier = item.interestedUserId;
            const isCarrierInterest = carrier.role === 'carrier';
            const phone = carrier.phone?.trim();
            const email = carrier.email?.trim();
            const digits = phone?.replace(/\D/g, '') ?? '';
            return (
              <View key={item._id} style={styles.interestCard}>
                <Text style={styles.interestName}>{carrier.name}</Text>
                {carrier.locationLabel ? (
                  <Text style={styles.interestDetail}>📍 {carrier.locationLabel}</Text>
                ) : null}
                {carrier.bio ? (
                  <Text style={styles.interestDetail} numberOfLines={2}>{carrier.bio}</Text>
                ) : null}
                <ContactActions
                  phone={phone}
                  email={email}
                  onCall={() => {
                    if (phone) Linking.openURL(`tel:${phone}`);
                  }}
                  onWhatsApp={() => {
                    if (digits) Linking.openURL(`https://wa.me/${digits}`);
                  }}
                  onEmail={() => {
                    if (email) Linking.openURL(`mailto:${email}`);
                  }}
                />
                <View style={styles.interestActions}>
                  {isCarrierInterest && user.role === 'shipper' ? (
                    <View style={styles.interestActionBtn}>
                      <Button
                        title="View profile"
                        onPress={() => openCarrierProfile(carrier._id)}
                        compact
                      />
                    </View>
                  ) : null}
                  <View style={styles.interestActionBtn}>
                    <Button
                      title="Leave review"
                      onPress={() => {
                        setReviewTarget({ id: carrier._id, name: carrier.name });
                        setReviewModal(true);
                      }}
                      variant="secondary"
                      compact
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
        <Button
          title="Close"
          onPress={() => {
            setInterestModal(false);
            setInterestShipmentId(null);
          }}
        />
      </ModalSheet>

      <ModalSheet visible={reviewModal} title={`Review ${reviewTarget?.name ?? ''}`} onClose={() => setReviewModal(false)}>
        <Input label="Rating (1–5)" placeholder="5" keyboardType="number-pad" value={reviewRating} onChangeText={setReviewRating} />
        <Input label="Comment (optional)" placeholder="Share your experience" value={reviewComment} onChangeText={setReviewComment} multiline />
        <Button title="Submit review" onPress={submitReview} />
        <Button title="Cancel" onPress={() => setReviewModal(false)} variant="ghost" />
      </ModalSheet>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flexList: { flex: 1 },
  browseHeader: { gap: spacing.md, paddingBottom: spacing.sm },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  countText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  countHint: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  locationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  toastWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  bannerActions: { flexDirection: 'row', gap: spacing.sm },
  filterForm: { gap: spacing.sm },
  adminWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl, gap: spacing.lg },
  adminTitle: { color: colors.text, fontSize: 24, fontWeight: '800' },
  adminSubtitle: { color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  modalScroll: { maxHeight: 360, marginBottom: spacing.lg },
  mineSubTabs: { marginBottom: spacing.md },
  interestCard: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  interestName: { color: colors.text, fontSize: 17, fontWeight: '700' },
  interestDetail: { color: colors.textMuted, fontSize: 14 },
  interestActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  interestActionBtn: { flex: 1 },
});
