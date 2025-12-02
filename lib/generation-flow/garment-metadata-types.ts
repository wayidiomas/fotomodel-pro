/**
 * Categorias de peças de roupa (moda ocidental)
 */
export enum GarmentCategory {
  // PARTE SUPERIOR - Casual
  TSHIRT = 'Camiseta',
  TANK_TOP = 'Regata',
  POLO = 'Polo',
  HENLEY = 'Henley',
  LONG_SLEEVE = 'Manga Longa',

  // PARTE SUPERIOR - Formal/Social
  DRESS_SHIRT = 'Camisa Social',
  BLOUSE = 'Blusa',
  BUTTON_DOWN = 'Camisa Botão',

  // PARTE SUPERIOR - Tricot/Malha
  SWEATER = 'Suéter',
  CARDIGAN = 'Cardigan',
  PULLOVER = 'Pullover',
  TURTLENECK = 'Gola Alta',

  // PARTE SUPERIOR - Moletom/Esporte
  HOODIE = 'Moletom com Capuz',
  SWEATSHIRT = 'Moletom',
  TRACK_JACKET = 'Jaqueta de Treino',

  // PARTE SUPERIOR - Casacos/Jaquetas
  BLAZER = 'Blazer',
  SUIT_JACKET = 'Paletó',
  BOMBER_JACKET = 'Jaqueta Bomber',
  DENIM_JACKET = 'Jaqueta Jeans',
  LEATHER_JACKET = 'Jaqueta de Couro',
  TRENCH_COAT = 'Trench Coat',
  PARKA = 'Parka',
  PEACOAT = 'Peacoat',
  PUFFER_JACKET = 'Jaqueta Puffer',
  WINDBREAKER = 'Corta-vento',
  VEST = 'Colete',

  // PARTE INFERIOR - Calças
  JEANS = 'Jeans',
  DRESS_PANTS = 'Calça Social',
  CHINOS = 'Chino',
  CARGO_PANTS = 'Calça Cargo',
  JOGGERS = 'Jogger',
  SWEATPANTS = 'Calça de Moletom',
  LEGGINGS = 'Legging',

  // PARTE INFERIOR - Shorts
  SHORTS = 'Shorts',
  BERMUDA = 'Bermuda',
  CARGO_SHORTS = 'Shorts Cargo',
  ATHLETIC_SHORTS = 'Shorts Esportivo',

  // PARTE INFERIOR - Saias
  PENCIL_SKIRT = 'Saia Lápis',
  A_LINE_SKIRT = 'Saia Evasê',
  MIDI_SKIRT = 'Saia Midi',
  MAXI_SKIRT = 'Saia Longa',
  MINI_SKIRT = 'Minissaia',
  PLEATED_SKIRT = 'Saia Plissada',

  // VESTIDOS
  CASUAL_DRESS = 'Vestido Casual',
  COCKTAIL_DRESS = 'Vestido de Coquetel',
  EVENING_GOWN = 'Vestido de Gala',
  MIDI_DRESS = 'Vestido Midi',
  MAXI_DRESS = 'Vestido Longo',
  SHIRT_DRESS = 'Chemise',
  WRAP_DRESS = 'Vestido Transpassado',
  SUNDRESS = 'Vestido de Verão',

  // MACACÕES
  JUMPSUIT = 'Macacão',
  ROMPER = 'Macaquinho',
  OVERALLS = 'Jardineira',

  // OUTROS
  OTHER = 'Outro',
}

/**
 * Cores principais
 */
export enum GarmentColor {
  // Básicas
  WHITE = 'Branco',
  BLACK = 'Preto',
  GRAY = 'Cinza',
  BEIGE = 'Bege',
  BROWN = 'Marrom',

  // Quentes
  RED = 'Vermelho',
  ORANGE = 'Laranja',
  YELLOW = 'Amarelo',
  PINK = 'Rosa',
  BURGUNDY = 'Bordô',

  // Frias
  BLUE = 'Azul',
  NAVY = 'Azul Marinho',
  LIGHT_BLUE = 'Azul Claro',
  TEAL = 'Verde-azulado',
  PURPLE = 'Roxo',
  VIOLET = 'Violeta',

  // Verdes
  GREEN = 'Verde',
  OLIVE = 'Verde Oliva',
  MINT = 'Verde Menta',

  // Metálicas/Especiais
  GOLD = 'Dourado',
  SILVER = 'Prateado',
  BRONZE = 'Bronze',

  // Tons pastéis/claros
  CREAM = 'Creme',
  IVORY = 'Marfim',
  KHAKI = 'Cáqui',
  TAN = 'Tan',

  // Multicolorido
  MULTICOLOR = 'Multicolorido',
}

/**
 * Ocasiões de uso
 */
export enum GarmentOccasion {
  CASUAL = 'Casual',
  FORMAL = 'Formal',
  BUSINESS = 'Trabalho/Negócios',
  BUSINESS_CASUAL = 'Social Esporte',
  PARTY = 'Festa',
  COCKTAIL = 'Coquetel',
  WEDDING = 'Casamento',
  SPORT = 'Esporte/Academia',
  BEACH = 'Praia/Piscina',
  HOME = 'Casa/Conforto',
  OUTDOOR = 'Ao Ar Livre',
  NIGHT_OUT = 'Noite/Balada',
  DATE = 'Encontro Romântico',
  EVERYDAY = 'Dia a Dia',
}

/**
 * Padrões/Estampas
 */
export enum GarmentPattern {
  SOLID = 'Liso',
  STRIPED = 'Listrado',
  CHECKERED = 'Xadrez',
  PLAID = 'Xadrez Escocês',
  GINGHAM = 'Vichy',
  FLORAL = 'Floral',
  PAISLEY = 'Paisley',
  POLKA_DOT = 'Poá/Bolinhas',
  GEOMETRIC = 'Geométrico',
  ABSTRACT = 'Abstrato',
  ANIMAL_PRINT = 'Animal Print',
  LEOPARD = 'Oncinha',
  ZEBRA = 'Zebra',
  SNAKE = 'Cobra',
  CAMOUFLAGE = 'Camuflado',
  TIE_DYE = 'Tie Dye',
  OMBRE = 'Degradê',
  COLOR_BLOCK = 'Color Block',
  GRAPHIC = 'Estampa Gráfica',
  LOGO = 'Logo/Marca',
}

/**
 * Estação do ano
 */
export enum GarmentSeason {
  SPRING = 'Primavera',
  SUMMER = 'Verão',
  FALL = 'Outono',
  WINTER = 'Inverno',
  ALL_SEASON = 'Meia-estação',
}

/**
 * Material/Tecido
 */
export enum GarmentMaterial {
  COTTON = 'Algodão',
  POLYESTER = 'Poliéster',
  DENIM = 'Jeans/Denim',
  WOOL = 'Lã',
  SILK = 'Seda',
  LINEN = 'Linho',
  LEATHER = 'Couro',
  SUEDE = 'Camurça',
  VELVET = 'Veludo',
  CASHMERE = 'Cashmere',
  FLEECE = 'Fleece/Soft',
  NYLON = 'Nylon',
  SPANDEX = 'Elastano/Spandex',
  VISCOSE = 'Viscose',
  KNIT = 'Malha/Tricô',
  BLEND = 'Misto',
}

/**
 * Metadados completos de uma peça de roupa (gerados pela IA)
 */
export interface GarmentMetadata {
  /** Categoria da peça */
  category: GarmentCategory;

  /** Cores predominantes (até 3) */
  colors: GarmentColor[];

  /** Descrição detalhada gerada pela IA */
  description: string;

  /** Ocasiões de uso */
  occasions: GarmentOccasion[];

  /** Padrões/Estampas */
  patterns: GarmentPattern[];

  /** Estação do ano recomendada (opcional) */
  season?: GarmentSeason;

  /** Material/Tecido identificado (opcional) */
  material?: GarmentMaterial;

  /** Análise de estilo adicional (opcional) */
  styleNotes?: string;
}

/**
 * Response da API de categorização
 */
export interface CategorizationResponse {
  success: boolean;
  metadata?: GarmentMetadata;
  error?: string;
}

/**
 * Converte enum para array de opções para select/dropdown
 */
export function enumToOptions<T extends Record<string, string>>(
  enumObj: T
): Array<{ value: keyof T; label: string }> {
  return Object.entries(enumObj).map(([key, value]) => ({
    value: key as keyof T,
    label: value,
  }));
}

/**
 * Labels em português para os enums
 */
export const EnumLabels = {
  GarmentCategory: 'Tipo de Peça',
  GarmentColor: 'Cores',
  GarmentOccasion: 'Ocasiões',
  GarmentPattern: 'Padrões',
  GarmentSeason: 'Estação',
  GarmentMaterial: 'Material',
} as const;
