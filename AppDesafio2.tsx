import 'react-native-gesture-handler';
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, ImageSourcePropType, StatusBar } from 'react-native';
import { NavigationContainer, DrawerActions, DefaultTheme as NavLight } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Provider as PaperProvider,
  MD3LightTheme,
  Appbar,
  Text,
  Button,
  Card,
  Icon,
  Searchbar,
  ActivityIndicator,
  Title,
  Paragraph,
  Avatar
} from 'react-native-paper';

// --- Tipos de Dados ---

type Livro = {
  key: string;
  title: string;
  authors: string;
  cover: string;
  first_publish_year: number;
};

// --- Tipos de Navegação ---

type RootDrawerParamList = {
  Principal: undefined;
  Sobre: undefined;
};

type RootStackParamList = {
  Tabs: undefined;
  Detalhes: { book: Livro }; // Agora aceita um objeto Livro
};

// --- Configuração da Navegação ---

const Drawer = createDrawerNavigator<RootDrawerParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

// --- Configuração da API ---

const API_BASE = "https://openlibrary.org/search.json";
const COVER_BASE_URL = "https://covers.openlibrary.org/b/id/";
const INITIAL_QUERY = "fantasy"; // Tema inicial

// --- Temas ---

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    background: '#F0F2F5',
    surface: '#FFFFFF',
  },
};

const navTheme = {
  ...NavLight,
  colors: {
    ...NavLight.colors,
    background: '#F0F2F5',
    card: '#FFFFFF',
    text: '#000000',
    border: '#E5E7EB',
  },
};

// --- Componentes Auxiliares ---

function Header({ title, navigation, showBack = false }: any) {
  return (
    <Appbar.Header mode="center-aligned" elevated>
      {showBack ? (
        <Appbar.BackAction onPress={() => navigation.goBack()} />
      ) : (
        <Appbar.Action icon="menu" onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} />
      )}
      <Appbar.Content title={title} />
    </Appbar.Header>
  );
}

function ScreenContainer({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

// --- Telas da Aplicação ---

// 1. Tela Principal (Lista de Livros) - Substitui a antiga HomeScreen
function BookListScreen({ navigation }: any) {
  const [books, setBooks] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadBooks = useCallback(async () => {
    setRefreshing(true);
    const query = searchQuery || INITIAL_QUERY;
    
    try {
      const res = await fetch(`${API_BASE}?q=${query}&limit=20`);
      const json = await res.json();
      const rawList = json.docs || [];

      const data: Livro[] = rawList
        .filter((doc: any) => doc.cover_i) // Apenas com capa
        .map((doc: any) => ({
          key: doc.key,
          title: doc.title,
          authors: doc.author_name ? doc.author_name.slice(0, 2).join(', ') : 'Autor Desconhecido',
          cover: `${COVER_BASE_URL}${doc.cover_i}-M.jpg`,
          first_publish_year: doc.first_publish_year || 0,
        }));

      setBooks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadBooks();
  }, []);

  return (
    <ScreenContainer>
      <Searchbar
        placeholder="Buscar livros (ex: horror)..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={loadBooks}
        icon="book-search"
        style={styles.searchBar}
      />
      
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator animating={true} size="large" />
          <Text style={{ marginTop: 10 }}>Buscando na Open Library...</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.key}
          onRefresh={loadBooks}
          refreshing={refreshing}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
              Nenhum livro encontrado. Tente outro termo.
            </Text>
          }
          renderItem={({ item }) => (
            <Card
              mode="elevated"
              style={styles.card}
              onPress={() => navigation.navigate('Detalhes', { book: item })}
            >
              <View style={{ flexDirection: 'row' }}>
                <Card.Cover source={{ uri: item.cover }} style={styles.cardThumb} />
                <Card.Content style={{ flex: 1, justifyContent: 'center', paddingVertical: 10 }}>
                  <Title numberOfLines={2} style={{ fontSize: 16 }}>{item.title}</Title>
                  <Paragraph numberOfLines={1} style={{ color: '#666' }}>{item.authors}</Paragraph>
                  <View style={styles.chip}>
                     <Text style={{ fontSize: 12, color: '#FFF' }}>{item.first_publish_year}</Text>
                  </View>
                </Card.Content>
                <Card.Actions style={{ justifyContent: 'center' }}>
                  <Icon source="chevron-right" size={24} color="#CCC" />
                </Card.Actions>
              </View>
            </Card>
          )}
        />
      )}
    </ScreenContainer>
  );
}

// 2. Tela de Feed (Placeholder Simples)
function FeedScreen({ navigation }: any) {
  return (
    <ScreenContainer>
      <Card mode="outlined">
        <Card.Title title="Notícias Literárias" left={(p) => <Avatar.Icon {...p} icon="newspaper" />} />
        <Card.Content>
          <Paragraph>Aqui ficaria um feed de lançamentos e notícias do mundo dos livros.</Paragraph>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

// 3. Configuração das Abas (Tabs)
function TabsScreen() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: paperTheme.colors.primary,
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopWidth: 0, elevation: 5 },
        tabBarIcon: ({ color, size }) => {
          const icon = route.name === 'Catálogo' ? 'book-open-variant' : 'newspaper-variant';
          return <Icon source={icon} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Catálogo" component={BookListScreen} />
      <Tabs.Screen name="Feed" component={FeedScreen} />
    </Tabs.Navigator>
  );
}

// 4. Tela de Detalhes (Recebe dados da API via navegação)
function DetalhesScreen({ route, navigation }: any) {
  const { book } = route.params; // Recupera o objeto livro passado

  return (
    <>
      <Header title="Detalhes do Livro" navigation={navigation} showBack={true} />
      <ScreenContainer>
        <Card mode="elevated" style={{ padding: 10 }}>
          <Card.Cover source={{ uri: book.cover }} style={styles.detailCover} />
          <Card.Title 
            title={book.title} 
            subtitle={`Autor: ${book.authors}`} 
            titleStyle={{ fontSize: 22, fontWeight: 'bold', marginTop: 10 }}
          />
          <Card.Content>
            <Paragraph style={{ marginBottom: 10 }}>
              Ano da primeira publicação: <Text style={{ fontWeight: 'bold' }}>{book.first_publish_year}</Text>
            </Paragraph>
            <Paragraph>
              Chave de identificação OL: {book.key}
            </Paragraph>
            <View style={{ marginTop: 20 }}>
              <Button mode="contained" icon="bookmark-outline" onPress={() => alert('Salvo nos favoritos!')}>
                Favoritar Livro
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScreenContainer>
    </>
  );
}

// 5. Stack Principal (Conecta Tabs e Detalhes)
function StackPrincipal({ navigation }: any) {
  return (
    <>
      {/* Header global para o Drawer funcionar na Stack principal */}
      <Header title="Open Library App" navigation={navigation} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabsScreen} />
        <Stack.Screen name="Detalhes" component={DetalhesScreen} />
      </Stack.Navigator>
    </>
  );
}

// 6. Tela Sobre (Drawer)
function SobreScreen({ navigation }: any) {
  return (
    <>
      <Header title="Sobre" navigation={navigation} />
      <ScreenContainer>
        <View style={styles.center}>
          <Avatar.Icon size={80} icon="information" />
          <Title style={{ marginTop: 20 }}>Open Library Client</Title>
          <Paragraph style={{ textAlign: 'center', marginTop: 10 }}>
            Este app demonstra o uso de React Native Paper com navegação complexa consumindo uma API pública.
          </Paragraph>
          <Button style={{ marginTop: 20 }} mode="outlined" onPress={() => navigation.goBack()}>
            Voltar
          </Button>
        </View>
      </ScreenContainer>
    </>
  );
}

// --- Componente Principal (App) ---

export default function App() {
  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar barStyle="light-content" backgroundColor={paperTheme.colors.primary} />
      <NavigationContainer theme={navTheme}>
        <Drawer.Navigator
          screenOptions={{
            headerShown: false,
            drawerActiveTintColor: paperTheme.colors.primary,
            drawerStyle: { backgroundColor: '#FFFFFF' },
          }}
        >
          <Drawer.Screen
            name="Principal"
            component={StackPrincipal}
            options={{
              drawerIcon: ({ color, size }) => <Icon source="home" size={size} color={color} />,
              title: "Início"
            }}
          />
          <Drawer.Screen
            name="Sobre"
            component={SobreScreen}
            options={{
              drawerIcon: ({ color, size }) => <Icon source="information" size={size} color={color} />,
            }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

// --- Estilos ---

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F0F2F5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  searchBar: {
    marginBottom: 10,
    elevation: 2,
    backgroundColor: '#FFF'
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#FFF',
  },
  cardThumb: {
    width: 80,
    height: 120,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    resizeMode: 'cover', // Garante que a imagem preencha o espaço sem distorcer
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0
  },
  chip: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 5
  },
  detailCover: {
    height: 250,
    resizeMode: 'contain', // Mostra a capa inteira nos detalhes
    backgroundColor: '#f0f0f0'
  }
});
