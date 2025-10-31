export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  AWSDate: { input: string; output: string; }
  AWSDateTime: { input: string; output: string; }
  AWSEmail: { input: string; output: string; }
  AWSIPAddress: { input: string; output: string; }
  AWSJSON: { input: string; output: string; }
  AWSPhone: { input: string; output: string; }
  AWSTime: { input: string; output: string; }
  AWSTimestamp: { input: number; output: number; }
  AWSURL: { input: string; output: string; }
};

export type BlockEvent = {
  __typename?: 'BlockEvent';
  blockedBy: Scalars['ID']['output'];
  blockedUser: Scalars['ID']['output'];
  timestamp: Scalars['AWSDateTime']['output'];
};

export type CashConfig = {
  __typename?: 'CashConfig';
  benefits_or_legal?: Maybe<Array<Maybe<Statements>>>;
  deadline_days_to_pay: Scalars['Int']['output'];
  discount: Scalars['Float']['output'];
  discount_type: DiscountType;
  payment_methods: Array<PaymentMethods>;
};

export type CashConfigInput = {
  benefits_or_legal?: InputMaybe<Array<InputMaybe<StatementsInput>>>;
  deadline_days_to_pay: Scalars['Int']['input'];
  discount: Scalars['Float']['input'];
  discount_type: DiscountType;
  payment_methods: Array<PaymentMethods>;
};

export type ChangePolicy = {
  __typename?: 'ChangePolicy';
  allows_date_change: Scalars['Boolean']['output'];
  deadline_days_to_make_change: Scalars['Int']['output'];
};

export type ChangePolicyInput = {
  allows_date_change: Scalars['Boolean']['input'];
  deadline_days_to_make_change: Scalars['Int']['input'];
};

export type ChatLocation = {
  __typename?: 'ChatLocation';
  lat: Scalars['Float']['output'];
  lng: Scalars['Float']['output'];
};

export type ChatLocationInput = {
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
};

export type ChildRange = {
  __typename?: 'ChildRange';
  child_price: Scalars['Float']['output'];
  max_minor_age: Scalars['Int']['output'];
  min_minor_age: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type ChildRangeInput = {
  child_price: Scalars['Float']['input'];
  max_minor_age: Scalars['Int']['input'];
  min_minor_age: Scalars['Int']['input'];
  name: Scalars['String']['input'];
};

export type CognitoUser = {
  __typename?: 'CognitoUser';
  address?: Maybe<Scalars['String']['output']>;
  birthdate?: Maybe<Scalars['String']['output']>;
  budget?: Maybe<Scalars['String']['output']>;
  cognito_sub?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['AWSDateTime']['output']>;
  custom_attributes?: Maybe<Scalars['AWSJSON']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  email_verified?: Maybe<Scalars['Boolean']['output']>;
  family_name?: Maybe<Scalars['String']['output']>;
  gender?: Maybe<Scalars['String']['output']>;
  given_name?: Maybe<Scalars['String']['output']>;
  have_a_passport?: Maybe<Scalars['Boolean']['output']>;
  have_a_visa?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  interest_rate?: Maybe<Scalars['String']['output']>;
  last_sync?: Maybe<Scalars['AWSDateTime']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  phone_number?: Maybe<Scalars['String']['output']>;
  phone_number_verified?: Maybe<Scalars['Boolean']['output']>;
  profile_photo_path?: Maybe<Scalars['String']['output']>;
  profile_preferences?: Maybe<Scalars['String']['output']>;
  provider_is_approved?: Maybe<Scalars['Boolean']['output']>;
  providers_policies?: Maybe<Policy>;
  req_special_services?: Maybe<Scalars['Boolean']['output']>;
  updated_at?: Maybe<Scalars['AWSDateTime']['output']>;
  user_type?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  zoneinfo?: Maybe<Scalars['String']['output']>;
};

export type Comment = {
  __typename?: 'Comment';
  comment?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['AWSDateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  likeCount?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['AWSDateTime']['output']>;
  user_data?: Maybe<User>;
  viewerHasLiked?: Maybe<Scalars['Boolean']['output']>;
};

export type CommentMomentInput = {
  commentsCommentID?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type Conversation = {
  __typename?: 'Conversation';
  createdAt: Scalars['AWSDateTime']['output'];
  id: Scalars['ID']['output'];
  lastMessage?: Maybe<LastMessage>;
  participantIds: Array<Scalars['ID']['output']>;
  participantTypes: Array<ParticipantType>;
  participantUsernames: Array<Scalars['String']['output']>;
  unreadCount?: Maybe<Array<Maybe<UnreadCount>>>;
  updatedAt: Scalars['AWSDateTime']['output'];
};

export type ConversationConnection = {
  __typename?: 'ConversationConnection';
  items: Array<Conversation>;
  nextToken?: Maybe<Scalars['String']['output']>;
};

export type CreateCommentInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  moment_id?: InputMaybe<Scalars['String']['input']>;
};

export type CreateMomentInput = {
  audioUrl?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  destination?: InputMaybe<Array<InputMaybe<LocationInput>>>;
  experienceLink?: InputMaybe<Scalars['String']['input']>;
  preferences?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  resourceType?: InputMaybe<Scalars['String']['input']>;
  resourceUrl?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type CreateProductOfTypeCircuitInput = {
  name: Scalars['String']['input'];
};

export type CreateProductOfTypePackageInput = {
  name: Scalars['String']['input'];
};

export type DiscountType =
  | 'AMOUNT'
  | 'PERCENTAGE'
  | '%future added value';

export type DownPaymentType =
  | 'AMOUNT'
  | 'PERCENTAGE'
  | '%future added value';

export type Follow = {
  __typename?: 'Follow';
  createdAt: Scalars['AWSDateTime']['output'];
  follower?: Maybe<User>;
  followerId: Scalars['ID']['output'];
  following?: Maybe<User>;
  followingId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  notificationEnabled: Scalars['Boolean']['output'];
  status: FollowStatus;
};

export type FollowConnection = {
  __typename?: 'FollowConnection';
  items: Array<Follow>;
  nextToken?: Maybe<Scalars['String']['output']>;
  total: Scalars['Int']['output'];
};

export type FollowStatus =
  | 'ACTIVE'
  | 'BLOCKED'
  | '%future added value';

export type Friendship = {
  __typename?: 'Friendship';
  createdAt: Scalars['AWSDateTime']['output'];
  friend?: Maybe<User>;
  friendId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  initiatedBy: Scalars['ID']['output'];
  status: FriendshipStatus;
  updatedAt: Scalars['AWSDateTime']['output'];
  user?: Maybe<User>;
  userId: Scalars['ID']['output'];
};

export type FriendshipConnection = {
  __typename?: 'FriendshipConnection';
  items: Array<Friendship>;
  nextToken?: Maybe<Scalars['String']['output']>;
  total: Scalars['Int']['output'];
};

export type FriendshipStatus =
  | 'ACCEPTED'
  | 'BLOCKED'
  | 'CANCELLED'
  | 'PENDING'
  | 'REJECTED'
  | '%future added value';

export type GeneralPolicies = {
  __typename?: 'GeneralPolicies';
  change_policy?: Maybe<ChangePolicy>;
};

export type GeneralPoliciesInput = {
  change_policy?: InputMaybe<ChangePolicyInput>;
};

export type GuaranteedDepartures = {
  __typename?: 'GuaranteedDepartures';
  days?: Maybe<Array<Maybe<WeekDays>>>;
  id?: Maybe<Scalars['ID']['output']>;
  origin?: Maybe<Array<Maybe<Location>>>;
  specific_dates?: Maybe<Array<Maybe<Scalars['AWSDateTime']['output']>>>;
};

export type GuaranteedDeparturesInput = {
  days?: InputMaybe<Array<InputMaybe<WeekDays>>>;
  origin?: InputMaybe<Array<InputMaybe<LocationInput>>>;
  specific_dates?: InputMaybe<Array<InputMaybe<Scalars['AWSDateTime']['input']>>>;
};

export type HolderCompanions = {
  __typename?: 'HolderCompanions';
  birthday: Scalars['AWSDateTime']['output'];
  country: Scalars['String']['output'];
  family_name: Scalars['String']['output'];
  gender: Scalars['String']['output'];
  name: Scalars['String']['output'];
  passport_number?: Maybe<Scalars['Int']['output']>;
};

export type HolderCompanionsInput = {
  birthday: Scalars['AWSDateTime']['input'];
  country: Scalars['String']['input'];
  family_name: Scalars['String']['input'];
  gender: Scalars['String']['input'];
  name: Scalars['String']['input'];
  passport_number?: InputMaybe<Scalars['Int']['input']>;
};

export type InstallmentIntervals =
  | 'MENSUAL'
  | 'QUINCENAL'
  | '%future added value';

export type InstallmentsConfig = {
  __typename?: 'InstallmentsConfig';
  benefits_or_legal?: Maybe<Array<Maybe<Statements>>>;
  days_before_must_be_settled: Scalars['Int']['output'];
  deadline_days_to_pay: Scalars['Int']['output'];
  down_payment_after: Scalars['Float']['output'];
  down_payment_before: Scalars['Float']['output'];
  down_payment_type: DownPaymentType;
  installment_intervals: InstallmentIntervals;
  payment_methods: Array<PaymentMethods>;
};

export type InstallmentsConfigInput = {
  benefits_or_legal?: InputMaybe<Array<InputMaybe<StatementsInput>>>;
  days_before_must_be_settled: Scalars['Int']['input'];
  deadline_days_to_pay: Scalars['Int']['input'];
  down_payment_after: Scalars['Float']['input'];
  down_payment_before: Scalars['Float']['input'];
  down_payment_type: DownPaymentType;
  installment_intervals: InstallmentIntervals;
  payment_methods: Array<PaymentMethods>;
};

export type LastMessage = {
  __typename?: 'LastMessage';
  content: Scalars['String']['output'];
  senderId: Scalars['ID']['output'];
  timestamp: Scalars['AWSDateTime']['output'];
};

export type LikableItem = {
  id: Scalars['ID']['output'];
  likeCount: Scalars['Int']['output'];
  viewerHasLiked: Scalars['Boolean']['output'];
};

export type LikeMomentInput = {
  likesUserId?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type LikePayload = {
  __typename?: 'LikePayload';
  newLikeCount: Scalars['Int']['output'];
  success: Scalars['Boolean']['output'];
  viewerHasLiked: Scalars['Boolean']['output'];
};

export type Location = {
  __typename?: 'Location';
  complementary_description?: Maybe<Scalars['String']['output']>;
  coordinates?: Maybe<Point>;
  id?: Maybe<Scalars['ID']['output']>;
  place?: Maybe<Scalars['String']['output']>;
  placeSub?: Maybe<Scalars['String']['output']>;
};

export type LocationInput = {
  complementary_description?: InputMaybe<Scalars['String']['input']>;
  coordinates?: InputMaybe<PointInput>;
  place?: InputMaybe<Scalars['String']['input']>;
  placeSub?: InputMaybe<Scalars['String']['input']>;
};

export type Message = {
  __typename?: 'Message';
  content: Scalars['String']['output'];
  conversationId: Scalars['ID']['output'];
  createdAt: Scalars['AWSDateTime']['output'];
  id: Scalars['ID']['output'];
  metadata?: Maybe<MessageMetadata>;
  senderId: Scalars['ID']['output'];
  senderUsername: Scalars['String']['output'];
  status: MessageStatus;
  timestamp: Scalars['AWSDateTime']['output'];
  type: MessageType;
};

export type MessageConnection = {
  __typename?: 'MessageConnection';
  items: Array<Message>;
  nextToken?: Maybe<Scalars['String']['output']>;
};

export type MessageMetadata = {
  __typename?: 'MessageMetadata';
  imageUrl?: Maybe<Scalars['String']['output']>;
  location?: Maybe<ChatLocation>;
};

export type MessageMetadataInput = {
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<ChatLocationInput>;
};

export type MessageStatus =
  | 'delivered'
  | 'read'
  | 'sent'
  | '%future added value';

export type MessageType =
  | 'image'
  | 'location'
  | 'text'
  | '%future added value';

export type Moment = {
  __typename?: 'Moment';
  audioUrl?: Maybe<Scalars['String']['output']>;
  comments?: Maybe<Array<Maybe<Scalars['ID']['output']>>>;
  created_at?: Maybe<Scalars['AWSDateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  destination?: Maybe<Array<Maybe<Location>>>;
  experienceLink?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  likeCount?: Maybe<Scalars['Int']['output']>;
  likes?: Maybe<User>;
  preferences?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  resourceType?: Maybe<Scalars['String']['output']>;
  resourceUrl?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  saveCount?: Maybe<Scalars['Int']['output']>;
  saves?: Maybe<User>;
  status?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  updated_at?: Maybe<Scalars['AWSDateTime']['output']>;
  user_data?: Maybe<User>;
  viewerHasLiked?: Maybe<Scalars['Boolean']['output']>;
  viewerHasSaved?: Maybe<Scalars['Boolean']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  acceptConnectionRequest: Friendship;
  blockUser: Scalars['Boolean']['output'];
  cancelConnectionRequest: Friendship;
  createComment?: Maybe<Comment>;
  createMoment?: Maybe<Moment>;
  createProductOfTypeCircuit?: Maybe<Product>;
  createProductOfTypePackage?: Maybe<Product>;
  createReservation?: Maybe<Reservation>;
  deleteProduct: Scalars['String']['output'];
  followUser: Follow;
  generatePaymentLink?: Maybe<PaymentResponse>;
  generatePaymentPlan?: Maybe<PaymentPlan>;
  markMessageAsDelivered: Message;
  markMessagesAsRead: Scalars['Boolean']['output'];
  rejectConnectionRequest: Friendship;
  removeConnection: Scalars['Boolean']['output'];
  sendConnectionRequest: Friendship;
  sendMessage: Message;
  toggleLike: LikePayload;
  toggleSave: SavePayload;
  unblockUser: Scalars['Boolean']['output'];
  unfollowUser: Scalars['Boolean']['output'];
  updatePaymentPlan?: Maybe<PaymentPlan>;
  updateProduct?: Maybe<Product>;
  updateProvidersPoliciesBySUB?: Maybe<Array<Maybe<Policy>>>;
  updateReservation?: Maybe<Reservation>;
};


export type MutationAcceptConnectionRequestArgs = {
  requestId: Scalars['ID']['input'];
};


export type MutationBlockUserArgs = {
  targetUserId: Scalars['ID']['input'];
};


export type MutationCancelConnectionRequestArgs = {
  requestId: Scalars['ID']['input'];
};


export type MutationCreateCommentArgs = {
  input: CreateCommentInput;
};


export type MutationCreateMomentArgs = {
  input: CreateMomentInput;
};


export type MutationCreateProductOfTypeCircuitArgs = {
  input: CreateProductOfTypeCircuitInput;
};


export type MutationCreateProductOfTypePackageArgs = {
  input: CreateProductOfTypePackageInput;
};


export type MutationCreateReservationArgs = {
  input?: InputMaybe<ReservationInput>;
};


export type MutationDeleteProductArgs = {
  id: Scalars['ID']['input'];
};


export type MutationFollowUserArgs = {
  targetUserId: Scalars['ID']['input'];
};


export type MutationGeneratePaymentLinkArgs = {
  input: PaymentInput;
};


export type MutationGeneratePaymentPlanArgs = {
  input: PaymentPlanInput;
};


export type MutationMarkMessageAsDeliveredArgs = {
  messageId: Scalars['ID']['input'];
};


export type MutationMarkMessagesAsReadArgs = {
  conversationId: Scalars['ID']['input'];
};


export type MutationRejectConnectionRequestArgs = {
  requestId: Scalars['ID']['input'];
};


export type MutationRemoveConnectionArgs = {
  connectionId: Scalars['ID']['input'];
};


export type MutationSendConnectionRequestArgs = {
  targetUserId: Scalars['ID']['input'];
};


export type MutationSendMessageArgs = {
  input: SendMessageInput;
};


export type MutationToggleLikeArgs = {
  item_id: Scalars['ID']['input'];
  item_type: Scalars['String']['input'];
};


export type MutationToggleSaveArgs = {
  item_id: Scalars['ID']['input'];
  item_type: Scalars['String']['input'];
};


export type MutationUnblockUserArgs = {
  targetUserId: Scalars['ID']['input'];
};


export type MutationUnfollowUserArgs = {
  targetUserId: Scalars['ID']['input'];
};


export type MutationUpdatePaymentPlanArgs = {
  input: UpdatePaymentPlanInput;
};


export type MutationUpdateProductArgs = {
  input: UpdateProductInput;
};


export type MutationUpdateProvidersPoliciesBySubArgs = {
  providers_policies?: InputMaybe<Array<PolicyInput>>;
};


export type MutationUpdateReservationArgs = {
  input?: InputMaybe<UpdateReservationInput>;
};

export type PaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};

export type ParticipantType = {
  __typename?: 'ParticipantType';
  userId: Scalars['ID']['output'];
  userType: Scalars['String']['output'];
};

export type Payment = {
  __typename?: 'Payment';
  created_at: Scalars['AWSDateTime']['output'];
  currency: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  mit_authorization?: Maybe<Scalars['String']['output']>;
  mit_reference?: Maybe<Scalars['String']['output']>;
  mit_transaction_id?: Maybe<Scalars['String']['output']>;
  payment_date?: Maybe<Scalars['AWSDateTime']['output']>;
  payment_method: Scalars['String']['output'];
  payment_url?: Maybe<Scalars['String']['output']>;
  reservation_id: Scalars['String']['output'];
  status: Scalars['String']['output'];
  total: Scalars['Float']['output'];
};

export type PaymentConfig = {
  __typename?: 'PaymentConfig';
  cash?: Maybe<CashConfig>;
  installments?: Maybe<InstallmentsConfig>;
};

export type PaymentConfigInput = {
  cash?: InputMaybe<CashConfigInput>;
  installments?: InputMaybe<InstallmentsConfigInput>;
};

export type PaymentInput = {
  payment_method: Scalars['String']['input'];
  promotions: Scalars['Boolean']['input'];
  reservation_id: Scalars['String']['input'];
};

export type PaymentMethods =
  | 'APPLE_PAY'
  | 'BANK_CARD'
  | 'CASH'
  | 'CLICK_TO_PAY'
  | 'CODI'
  | 'GOOGLE_PAY'
  | '%future added value';

export type PaymentOption = {
  __typename?: 'PaymentOption';
  benefits_or_legal?: Maybe<Array<Maybe<Statements>>>;
  config: PaymentConfig;
  description: Scalars['String']['output'];
  type: PaymentType;
};

export type PaymentOptionInput = {
  benefits_or_legal?: InputMaybe<Array<InputMaybe<StatementsInput>>>;
  config: PaymentConfigInput;
  description: Scalars['String']['input'];
  type: PaymentType;
};

export type PaymentPlan = {
  __typename?: 'PaymentPlan';
  allows_date_change?: Maybe<Scalars['Boolean']['output']>;
  benefits_statements?: Maybe<Array<Statements>>;
  cash_discount_amount?: Maybe<Scalars['Float']['output']>;
  cash_discount_percentage?: Maybe<Scalars['Float']['output']>;
  cash_final_amount?: Maybe<Scalars['Float']['output']>;
  cash_payment_deadline?: Maybe<Scalars['AWSDateTime']['output']>;
  cash_payment_methods?: Maybe<Array<Scalars['String']['output']>>;
  change_deadline_days?: Maybe<Scalars['Int']['output']>;
  created_at: Scalars['AWSDateTime']['output'];
  currency: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  installment_amount_per_payment?: Maybe<Scalars['Float']['output']>;
  installment_available_days?: Maybe<Scalars['Int']['output']>;
  installment_down_payment_amount?: Maybe<Scalars['Float']['output']>;
  installment_down_payment_percentage?: Maybe<Scalars['Float']['output']>;
  installment_first_payment_deadline?: Maybe<Scalars['AWSDateTime']['output']>;
  installment_frequency_days?: Maybe<Scalars['Int']['output']>;
  installment_number_of_payments?: Maybe<Scalars['Float']['output']>;
  installment_payment_deadline?: Maybe<Scalars['AWSDateTime']['output']>;
  installment_payment_methods?: Maybe<Array<Scalars['String']['output']>>;
  installment_total_amount?: Maybe<Scalars['Float']['output']>;
  payment_type_selected: PaymentType;
  product_id: Scalars['ID']['output'];
  reservation_date: Scalars['AWSDateTime']['output'];
  reservation_id: Scalars['ID']['output'];
  status: PaymentPlanStatus;
  total_cost: Scalars['Float']['output'];
  travel_date: Scalars['AWSDateTime']['output'];
  updated_at: Scalars['AWSDateTime']['output'];
};

export type PaymentPlanInput = {
  currency: Scalars['String']['input'];
  payment_type_selected: PaymentType;
  product_id: Scalars['ID']['input'];
  total_cost: Scalars['Float']['input'];
  travel_date: Scalars['AWSDateTime']['input'];
};

export type PaymentPlanStatus =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'SELECTED'
  | '%future added value';

export type PaymentPolicy = {
  __typename?: 'PaymentPolicy';
  created_at: Scalars['AWSDateTime']['output'];
  general_policies: GeneralPolicies;
  id: Scalars['ID']['output'];
  options: Array<PaymentOption>;
  product_id: Scalars['ID']['output'];
  provider_id: Scalars['ID']['output'];
  status: StatePolicy;
  updated_at: Scalars['AWSDateTime']['output'];
  version: Scalars['Int']['output'];
};

export type PaymentPolicyInput = {
  general_policies?: InputMaybe<GeneralPoliciesInput>;
  options?: InputMaybe<Array<InputMaybe<PaymentOptionInput>>>;
};

export type PaymentResponse = {
  __typename?: 'PaymentResponse';
  created_at: Scalars['AWSDateTime']['output'];
  currency: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  payment_method: Scalars['String']['output'];
  payment_url?: Maybe<Scalars['String']['output']>;
  reservation_id: Scalars['String']['output'];
  status: Scalars['String']['output'];
  total: Scalars['Float']['output'];
};

export type PaymentType =
  | 'CONTADO'
  | 'PLAZOS'
  | '%future added value';

export type Point = {
  __typename?: 'Point';
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
};

export type PointInput = {
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
};

export type Policy = {
  __typename?: 'Policy';
  policy?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type PolicyInput = {
  policy: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type Product = {
  __typename?: 'Product';
  cover_image_url?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['AWSDateTime']['output']>;
  departures?: Maybe<Array<Maybe<GuaranteedDepartures>>>;
  description?: Maybe<Scalars['String']['output']>;
  destination?: Maybe<Array<Maybe<Location>>>;
  id: Scalars['ID']['output'];
  image_url?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  is_foreign?: Maybe<Scalars['Boolean']['output']>;
  itinerary?: Maybe<Scalars['String']['output']>;
  languages?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  min_product_price?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  payment_policy?: Maybe<PaymentPolicy>;
  planned_hotels_or_similar?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  preferences?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  product_type?: Maybe<Scalars['String']['output']>;
  provider_id?: Maybe<Scalars['String']['output']>;
  published?: Maybe<Scalars['Boolean']['output']>;
  seasons?: Maybe<Array<Maybe<ProductSeason>>>;
  status?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['AWSDateTime']['output']>;
  user_data?: Maybe<User>;
  video_url?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type ProductConnection = {
  __typename?: 'ProductConnection';
  items?: Maybe<Array<Maybe<Product>>>;
  nextToken?: Maybe<Scalars['String']['output']>;
  total?: Maybe<Scalars['Int']['output']>;
};

export type ProductFilterInput = {
  product_type?: InputMaybe<Scalars['String']['input']>;
  provider_id?: InputMaybe<Scalars['String']['input']>;
  published?: InputMaybe<Scalars['Boolean']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type ProductPrice = {
  __typename?: 'ProductPrice';
  children: Array<ChildRange>;
  currency: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  max_adult: Scalars['Int']['output'];
  max_minor: Scalars['Int']['output'];
  price: Scalars['Float']['output'];
  room_name: Scalars['String']['output'];
};

export type ProductPriceInput = {
  children: Array<ChildRangeInput>;
  currency: Scalars['String']['input'];
  max_adult: Scalars['Int']['input'];
  max_minor: Scalars['Int']['input'];
  price: Scalars['Float']['input'];
  room_name: Scalars['String']['input'];
};

export type ProductSeason = {
  __typename?: 'ProductSeason';
  aditional_services?: Maybe<Scalars['String']['output']>;
  allotment?: Maybe<Scalars['Int']['output']>;
  allotment_remain?: Maybe<Scalars['Int']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  end_date?: Maybe<Scalars['AWSDateTime']['output']>;
  extra_prices?: Maybe<Array<Maybe<ProductPrice>>>;
  id: Scalars['ID']['output'];
  number_of_nights?: Maybe<Scalars['String']['output']>;
  prices?: Maybe<Array<Maybe<ProductPrice>>>;
  schedules?: Maybe<Scalars['String']['output']>;
  start_date?: Maybe<Scalars['AWSDateTime']['output']>;
};

export type ProductSeasonInput = {
  aditional_services?: InputMaybe<Scalars['String']['input']>;
  allotment?: InputMaybe<Scalars['Int']['input']>;
  allotment_remain?: InputMaybe<Scalars['Int']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  end_date?: InputMaybe<Scalars['AWSDateTime']['input']>;
  extra_prices?: InputMaybe<Array<InputMaybe<ProductPriceInput>>>;
  number_of_nights?: InputMaybe<Scalars['String']['input']>;
  prices?: InputMaybe<Array<InputMaybe<ProductPriceInput>>>;
  schedules?: InputMaybe<Scalars['String']['input']>;
  start_date?: InputMaybe<Scalars['AWSDateTime']['input']>;
};

export type Query = {
  __typename?: 'Query';
  getAllActiveAndPublishedProducts?: Maybe<ProductConnection>;
  getAllActiveMoments?: Maybe<Array<Maybe<Moment>>>;
  getAllActiveProductsByProvider?: Maybe<ProductConnection>;
  getAllCommentsByMomentID?: Maybe<Array<Maybe<Comment>>>;
  getAllMomentsByFollowing?: Maybe<Array<Maybe<Moment>>>;
  getAllMomentsByMyPreferences?: Maybe<Array<Maybe<Moment>>>;
  getAllMomentsByUser?: Maybe<Array<Maybe<Moment>>>;
  getAllProductsByEmail?: Maybe<ProductConnection>;
  getBlockedUsers: FriendshipConnection;
  getConversationById: Conversation;
  getConversationMessages: MessageConnection;
  getMyConnections: FriendshipConnection;
  getMyFollowers: FollowConnection;
  getMyFollowing: FollowConnection;
  getMyStats: UserStats;
  getOrCreateConversation: Conversation;
  getPaymentPlan?: Maybe<PaymentPlan>;
  getPaymentPlanByReservation?: Maybe<PaymentPlan>;
  getPendingConnectionRequests: FriendshipConnection;
  getProductById?: Maybe<Product>;
  getProductsByType?: Maybe<ProductConnection>;
  getProvidersPoliciesBySub?: Maybe<Array<Maybe<Policy>>>;
  getRelationshipStatus: RelationshipStatus;
  getReservationsBySUB?: Maybe<Array<Maybe<Reservation>>>;
  getSentConnectionRequests: FriendshipConnection;
  getUserByUsername?: Maybe<CognitoUser>;
  getUserStats: UserStats;
  listMyConversations: ConversationConnection;
};


export type QueryGetAllActiveAndPublishedProductsArgs = {
  filter?: InputMaybe<ProductFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryGetAllActiveProductsByProviderArgs = {
  filter?: InputMaybe<ProductFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryGetAllCommentsByMomentIdArgs = {
  moment_id: Scalars['ID']['input'];
};


export type QueryGetAllProductsByEmailArgs = {
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryGetBlockedUsersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetConversationByIdArgs = {
  conversationId: Scalars['ID']['input'];
};


export type QueryGetConversationMessagesArgs = {
  conversationId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetMyConnectionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<FriendshipStatus>;
};


export type QueryGetMyFollowersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetMyFollowingArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetOrCreateConversationArgs = {
  participantId: Scalars['ID']['input'];
};


export type QueryGetPaymentPlanArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetPaymentPlanByReservationArgs = {
  reservation_id: Scalars['ID']['input'];
};


export type QueryGetPendingConnectionRequestsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetProductByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetProductsByTypeArgs = {
  filter?: InputMaybe<ProductFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  product_type: Scalars['String']['input'];
};


export type QueryGetRelationshipStatusArgs = {
  targetUserId: Scalars['ID']['input'];
};


export type QueryGetSentConnectionRequestsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetUserByUsernameArgs = {
  username: Scalars['String']['input'];
};


export type QueryGetUserStatsArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryListMyConversationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};

export type RelationshipStatus = {
  __typename?: 'RelationshipStatus';
  canFollow: Scalars['Boolean']['output'];
  canSendRequest: Scalars['Boolean']['output'];
  connectionStatus?: Maybe<FriendshipStatus>;
  isConnected: Scalars['Boolean']['output'];
  isFollower: Scalars['Boolean']['output'];
  isFollowing: Scalars['Boolean']['output'];
  type: RelationshipType;
};

export type RelationshipType =
  | 'CONNECTION'
  | 'FOLLOWING'
  | 'MUTUAL'
  | 'NONE'
  | '%future added value';

export type Reservation = {
  __typename?: 'Reservation';
  adults?: Maybe<Scalars['Int']['output']>;
  babys?: Maybe<Scalars['Int']['output']>;
  companions?: Maybe<HolderCompanions>;
  experience_id?: Maybe<Scalars['String']['output']>;
  experience_type?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  kids?: Maybe<Scalars['Int']['output']>;
  payment_method?: Maybe<PaymentMethods>;
  price_per_kid?: Maybe<Scalars['Float']['output']>;
  price_per_person?: Maybe<Scalars['Float']['output']>;
  reservationDate?: Maybe<Scalars['AWSDateTime']['output']>;
  status?: Maybe<ReservationStatus>;
  total_price?: Maybe<Scalars['Float']['output']>;
  type: PaymentType;
};

export type ReservationInput = {
  adults: Scalars['Int']['input'];
  babys: Scalars['Int']['input'];
  collection_type: Scalars['String']['input'];
  companions?: InputMaybe<HolderCompanionsInput>;
  experience_id: Scalars['String']['input'];
  kids: Scalars['Int']['input'];
  payment_method?: InputMaybe<PaymentMethods>;
  price_per_kid: Scalars['Float']['input'];
  price_per_person: Scalars['Float']['input'];
  reservationDate?: InputMaybe<Scalars['AWSDateTime']['input']>;
  status?: InputMaybe<ReservationStatus>;
  total_price: Scalars['Float']['input'];
  type: PaymentType;
};

export type ReservationStatus =
  | 'AWAITING_MANUAL_PAYMENT'
  | 'CANCELED'
  | 'FINALIZED'
  | 'IN_PROGRESS'
  | 'MIT_PAYMENT_PENDING'
  | 'PROCESSED'
  | '%future added value';

export type SaveMomentInput = {
  savesUserId?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type SavePayload = {
  __typename?: 'SavePayload';
  newSaveCount: Scalars['Int']['output'];
  success: Scalars['Boolean']['output'];
  viewerHasSaved: Scalars['Boolean']['output'];
};

export type SendMessageInput = {
  content: Scalars['String']['input'];
  metadata?: InputMaybe<MessageMetadataInput>;
  recipientId: Scalars['ID']['input'];
  type?: InputMaybe<MessageType>;
};

export type StatePolicy =
  | 'ACTIVA'
  | 'ARCHIVADA'
  | 'INACTIVA'
  | '%future added value';

export type Statements = {
  __typename?: 'Statements';
  stated?: Maybe<Scalars['String']['output']>;
};

export type StatementsInput = {
  stated?: InputMaybe<Scalars['String']['input']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  onConnectionRequestAccepted?: Maybe<Friendship>;
  onConnectionRequestReceived?: Maybe<Friendship>;
  onMessageDelivered?: Maybe<Message>;
  onMessagesRead?: Maybe<Scalars['Boolean']['output']>;
  onNewFollower?: Maybe<Follow>;
  onNewMessage?: Maybe<Message>;
  onUserBlocked?: Maybe<Scalars['Boolean']['output']>;
};


export type SubscriptionOnConnectionRequestAcceptedArgs = {
  userId: Scalars['ID']['input'];
};


export type SubscriptionOnConnectionRequestReceivedArgs = {
  userId: Scalars['ID']['input'];
};


export type SubscriptionOnMessageDeliveredArgs = {
  conversationId: Scalars['ID']['input'];
};


export type SubscriptionOnMessagesReadArgs = {
  conversationId: Scalars['ID']['input'];
};


export type SubscriptionOnNewFollowerArgs = {
  userId: Scalars['ID']['input'];
};


export type SubscriptionOnNewMessageArgs = {
  conversationId: Scalars['ID']['input'];
};


export type SubscriptionOnUserBlockedArgs = {
  userId: Scalars['ID']['input'];
};

export type UnreadCount = {
  __typename?: 'UnreadCount';
  count?: Maybe<Scalars['Int']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export type UpdatePaymentPlanInput = {
  id: Scalars['ID']['input'];
  payment_type_selected?: InputMaybe<PaymentType>;
  status?: InputMaybe<PaymentPlanStatus>;
};

export type UpdateProductInput = {
  cover_image_url?: InputMaybe<Scalars['String']['input']>;
  departures?: InputMaybe<Array<InputMaybe<GuaranteedDeparturesInput>>>;
  description?: InputMaybe<Scalars['String']['input']>;
  destination?: InputMaybe<Array<InputMaybe<LocationInput>>>;
  id: Scalars['ID']['input'];
  image_url?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  itinerary?: InputMaybe<Scalars['String']['input']>;
  languages?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  payment_policy?: InputMaybe<PaymentPolicyInput>;
  planned_hotels_or_similar?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  preferences?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  published?: InputMaybe<Scalars['Boolean']['input']>;
  seasons?: InputMaybe<Array<InputMaybe<ProductSeasonInput>>>;
  video_url?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type UpdateReservationInput = {
  adults: Scalars['Int']['input'];
  babys: Scalars['Int']['input'];
  companions?: InputMaybe<HolderCompanionsInput>;
  kids: Scalars['Int']['input'];
  payment_method?: InputMaybe<PaymentMethods>;
  reservationDate: Scalars['AWSDateTime']['input'];
  type: PaymentType;
};

export type User = {
  __typename?: 'User';
  avatar_url?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  sub?: Maybe<Scalars['String']['output']>;
  user_type?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type UserInput = {
  bio?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['AWSDateTime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  profile_picture?: InputMaybe<Scalars['String']['input']>;
  sub?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type UserStats = {
  __typename?: 'UserStats';
  blockedUsersCount: Scalars['Int']['output'];
  connectionsCount: Scalars['Int']['output'];
  followersCount: Scalars['Int']['output'];
  followingCount: Scalars['Int']['output'];
  pendingRequestsReceived: Scalars['Int']['output'];
  pendingRequestsSent: Scalars['Int']['output'];
  userId: Scalars['ID']['output'];
};

export type WeekDays =
  | 'FRIDAY'
  | 'MONDAY'
  | 'SATURDAY'
  | 'SUNDAY'
  | 'THURSDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | '%future added value';

export type AcceptConnectionRequestMutationVariables = Exact<{
  requestId: Scalars['ID']['input'];
}>;


export type AcceptConnectionRequestMutation = { __typename?: 'Mutation', acceptConnectionRequest: { __typename?: 'Friendship', createdAt: string, friendId: string, id: string, initiatedBy: string, updatedAt: string, userId: string, friend?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, user?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } };

export type BlockUserMutationVariables = Exact<{
  targetUserId: Scalars['ID']['input'];
}>;


export type BlockUserMutation = { __typename?: 'Mutation', blockUser: boolean };

export type CancelConnectionRequestMutationVariables = Exact<{
  requestId: Scalars['ID']['input'];
}>;


export type CancelConnectionRequestMutation = { __typename?: 'Mutation', cancelConnectionRequest: { __typename?: 'Friendship', createdAt: string, friendId: string, id: string, initiatedBy: string, updatedAt: string, userId: string, friend?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, user?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } };

export type CreateCommentMutationVariables = Exact<{
  input: CreateCommentInput;
}>;


export type CreateCommentMutation = { __typename?: 'Mutation', createComment?: { __typename?: 'Comment', comment?: string | null | undefined, created_at?: string | null | undefined, id?: string | null | undefined, likeCount?: number | null | undefined, status?: string | null | undefined, updated_at?: string | null | undefined, viewerHasLiked?: boolean | null | undefined, user_data?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined };

export type CreateMomentMutationVariables = Exact<{
  input: CreateMomentInput;
}>;


export type CreateMomentMutation = { __typename?: 'Mutation', createMoment?: { __typename?: 'Moment', audioUrl?: string | null | undefined, comments?: Array<string | null | undefined> | null | undefined, created_at?: string | null | undefined, description?: string | null | undefined, experienceLink?: string | null | undefined, id?: string | null | undefined, likeCount?: number | null | undefined, preferences?: Array<string | null | undefined> | null | undefined, resourceType?: string | null | undefined, resourceUrl?: Array<string | null | undefined> | null | undefined, saveCount?: number | null | undefined, status?: string | null | undefined, tags?: Array<string | null | undefined> | null | undefined, updated_at?: string | null | undefined, viewerHasLiked?: boolean | null | undefined, viewerHasSaved?: boolean | null | undefined, destination?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined, likes?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, saves?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, user_data?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined };

export type CreateProductOfTypeCircuitMutationVariables = Exact<{
  input: CreateProductOfTypeCircuitInput;
}>;


export type CreateProductOfTypeCircuitMutation = { __typename?: 'Mutation', createProductOfTypeCircuit?: { __typename?: 'Product', cover_image_url?: string | null | undefined, created_at?: string | null | undefined, description?: string | null | undefined, id: string, image_url?: Array<string | null | undefined> | null | undefined, is_foreign?: boolean | null | undefined, itinerary?: string | null | undefined, languages?: Array<string | null | undefined> | null | undefined, min_product_price?: number | null | undefined, name?: string | null | undefined, planned_hotels_or_similar?: Array<string | null | undefined> | null | undefined, preferences?: Array<string | null | undefined> | null | undefined, product_type?: string | null | undefined, provider_id?: string | null | undefined, published?: boolean | null | undefined, status?: string | null | undefined, updated_at?: string | null | undefined, video_url?: Array<string | null | undefined> | null | undefined, departures?: Array<{ __typename?: 'GuaranteedDepartures', id?: string | null | undefined, specific_dates?: Array<string | null | undefined> | null | undefined, origin?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined } | null | undefined> | null | undefined, destination?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined, payment_policy?: { __typename?: 'PaymentPolicy', created_at: string, id: string, product_id: string, provider_id: string, updated_at: string, version: number, general_policies: { __typename?: 'GeneralPolicies', change_policy?: { __typename?: 'ChangePolicy', allows_date_change: boolean, deadline_days_to_make_change: number } | null | undefined }, options: Array<{ __typename?: 'PaymentOption', description: string, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined, config: { __typename?: 'PaymentConfig', cash?: { __typename?: 'CashConfig', deadline_days_to_pay: number, discount: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined, installments?: { __typename?: 'InstallmentsConfig', days_before_must_be_settled: number, deadline_days_to_pay: number, down_payment_after: number, down_payment_before: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined } }> } | null | undefined, seasons?: Array<{ __typename?: 'ProductSeason', aditional_services?: string | null | undefined, allotment?: number | null | undefined, allotment_remain?: number | null | undefined, category?: string | null | undefined, end_date?: string | null | undefined, id: string, number_of_nights?: string | null | undefined, schedules?: string | null | undefined, start_date?: string | null | undefined, extra_prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined, prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined } | null | undefined> | null | undefined, user_data?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined };

export type CreateProductOfTypePackageMutationVariables = Exact<{
  input: CreateProductOfTypePackageInput;
}>;


export type CreateProductOfTypePackageMutation = { __typename?: 'Mutation', createProductOfTypePackage?: { __typename?: 'Product', cover_image_url?: string | null | undefined, created_at?: string | null | undefined, description?: string | null | undefined, id: string, image_url?: Array<string | null | undefined> | null | undefined, is_foreign?: boolean | null | undefined, itinerary?: string | null | undefined, languages?: Array<string | null | undefined> | null | undefined, min_product_price?: number | null | undefined, name?: string | null | undefined, planned_hotels_or_similar?: Array<string | null | undefined> | null | undefined, preferences?: Array<string | null | undefined> | null | undefined, product_type?: string | null | undefined, provider_id?: string | null | undefined, published?: boolean | null | undefined, status?: string | null | undefined, updated_at?: string | null | undefined, video_url?: Array<string | null | undefined> | null | undefined, departures?: Array<{ __typename?: 'GuaranteedDepartures', id?: string | null | undefined, specific_dates?: Array<string | null | undefined> | null | undefined, origin?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined } | null | undefined> | null | undefined, destination?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined, payment_policy?: { __typename?: 'PaymentPolicy', created_at: string, id: string, product_id: string, provider_id: string, updated_at: string, version: number, general_policies: { __typename?: 'GeneralPolicies', change_policy?: { __typename?: 'ChangePolicy', allows_date_change: boolean, deadline_days_to_make_change: number } | null | undefined }, options: Array<{ __typename?: 'PaymentOption', description: string, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined, config: { __typename?: 'PaymentConfig', cash?: { __typename?: 'CashConfig', deadline_days_to_pay: number, discount: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined, installments?: { __typename?: 'InstallmentsConfig', days_before_must_be_settled: number, deadline_days_to_pay: number, down_payment_after: number, down_payment_before: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined } }> } | null | undefined, seasons?: Array<{ __typename?: 'ProductSeason', aditional_services?: string | null | undefined, allotment?: number | null | undefined, allotment_remain?: number | null | undefined, category?: string | null | undefined, end_date?: string | null | undefined, id: string, number_of_nights?: string | null | undefined, schedules?: string | null | undefined, start_date?: string | null | undefined, extra_prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined, prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined } | null | undefined> | null | undefined, user_data?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined };

export type CreateReservationMutationVariables = Exact<{
  input?: InputMaybe<ReservationInput>;
}>;


export type CreateReservationMutation = { __typename?: 'Mutation', createReservation?: { __typename?: 'Reservation', adults?: number | null | undefined, babys?: number | null | undefined, experience_id?: string | null | undefined, experience_type?: string | null | undefined, id: string, kids?: number | null | undefined, price_per_kid?: number | null | undefined, price_per_person?: number | null | undefined, reservationDate?: string | null | undefined, total_price?: number | null | undefined, companions?: { __typename?: 'HolderCompanions', birthday: string, country: string, family_name: string, gender: string, name: string, passport_number?: number | null | undefined } | null | undefined } | null | undefined };

export type DeleteProductMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteProductMutation = { __typename?: 'Mutation', deleteProduct: string };

export type FollowUserMutationVariables = Exact<{
  targetUserId: Scalars['ID']['input'];
}>;


export type FollowUserMutation = { __typename?: 'Mutation', followUser: { __typename?: 'Follow', createdAt: string, followerId: string, followingId: string, id: string, notificationEnabled: boolean, follower?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, following?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } };

export type GeneratePaymentLinkMutationVariables = Exact<{
  input: PaymentInput;
}>;


export type GeneratePaymentLinkMutation = { __typename?: 'Mutation', generatePaymentLink?: { __typename?: 'PaymentResponse', created_at: string, currency: string, id: string, payment_method: string, payment_url?: string | null | undefined, reservation_id: string, status: string, total: number } | null | undefined };

export type GeneratePaymentPlanMutationVariables = Exact<{
  input: PaymentPlanInput;
}>;


export type GeneratePaymentPlanMutation = { __typename?: 'Mutation', generatePaymentPlan?: { __typename?: 'PaymentPlan', id: string, product_id: string, reservation_id: string, status: PaymentPlanStatus, payment_type_selected: PaymentType, currency: string, total_cost: number, travel_date: string, reservation_date: string, created_at: string, updated_at: string, allows_date_change?: boolean | null | undefined, change_deadline_days?: number | null | undefined, cash_discount_amount?: number | null | undefined, cash_discount_percentage?: number | null | undefined, cash_final_amount?: number | null | undefined, cash_payment_deadline?: string | null | undefined, cash_payment_methods?: Array<string> | null | undefined, installment_down_payment_amount?: number | null | undefined, installment_down_payment_percentage?: number | null | undefined, installment_amount_per_payment?: number | null | undefined, installment_number_of_payments?: number | null | undefined, installment_frequency_days?: number | null | undefined, installment_total_amount?: number | null | undefined, installment_first_payment_deadline?: string | null | undefined, installment_payment_deadline?: string | null | undefined, installment_payment_methods?: Array<string> | null | undefined, installment_available_days?: number | null | undefined, benefits_statements?: Array<{ __typename?: 'Statements', stated?: string | null | undefined }> | null | undefined } | null | undefined };

export type MarkMessageAsDeliveredMutationVariables = Exact<{
  messageId: Scalars['ID']['input'];
}>;


export type MarkMessageAsDeliveredMutation = { __typename?: 'Mutation', markMessageAsDelivered: { __typename?: 'Message', content: string, conversationId: string, createdAt: string, id: string, senderId: string, senderUsername: string, timestamp: string, metadata?: { __typename?: 'MessageMetadata', imageUrl?: string | null | undefined, location?: { __typename?: 'ChatLocation', lat: number, lng: number } | null | undefined } | null | undefined } };

export type MarkMessagesAsReadMutationVariables = Exact<{
  conversationId: Scalars['ID']['input'];
}>;


export type MarkMessagesAsReadMutation = { __typename?: 'Mutation', markMessagesAsRead: boolean };

export type RejectConnectionRequestMutationVariables = Exact<{
  requestId: Scalars['ID']['input'];
}>;


export type RejectConnectionRequestMutation = { __typename?: 'Mutation', rejectConnectionRequest: { __typename?: 'Friendship', createdAt: string, friendId: string, id: string, initiatedBy: string, updatedAt: string, userId: string, friend?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, user?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } };

export type RemoveConnectionMutationVariables = Exact<{
  connectionId: Scalars['ID']['input'];
}>;


export type RemoveConnectionMutation = { __typename?: 'Mutation', removeConnection: boolean };

export type SendConnectionRequestMutationVariables = Exact<{
  targetUserId: Scalars['ID']['input'];
}>;


export type SendConnectionRequestMutation = { __typename?: 'Mutation', sendConnectionRequest: { __typename?: 'Friendship', createdAt: string, friendId: string, id: string, initiatedBy: string, updatedAt: string, userId: string, friend?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, user?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } };

export type SendMessageMutationVariables = Exact<{
  input: SendMessageInput;
}>;


export type SendMessageMutation = { __typename?: 'Mutation', sendMessage: { __typename?: 'Message', content: string, conversationId: string, createdAt: string, id: string, senderId: string, senderUsername: string, timestamp: string, metadata?: { __typename?: 'MessageMetadata', imageUrl?: string | null | undefined, location?: { __typename?: 'ChatLocation', lat: number, lng: number } | null | undefined } | null | undefined } };

export type ToggleLikeMutationVariables = Exact<{
  item_id: Scalars['ID']['input'];
  item_type: Scalars['String']['input'];
}>;


export type ToggleLikeMutation = { __typename?: 'Mutation', toggleLike: { __typename?: 'LikePayload', newLikeCount: number, success: boolean, viewerHasLiked: boolean } };

export type ToggleSaveMutationVariables = Exact<{
  item_id: Scalars['ID']['input'];
  item_type: Scalars['String']['input'];
}>;


export type ToggleSaveMutation = { __typename?: 'Mutation', toggleSave: { __typename?: 'SavePayload', newSaveCount: number, success: boolean, viewerHasSaved: boolean } };

export type UnblockUserMutationVariables = Exact<{
  targetUserId: Scalars['ID']['input'];
}>;


export type UnblockUserMutation = { __typename?: 'Mutation', unblockUser: boolean };

export type UnfollowUserMutationVariables = Exact<{
  targetUserId: Scalars['ID']['input'];
}>;


export type UnfollowUserMutation = { __typename?: 'Mutation', unfollowUser: boolean };

export type UpdatePaymentPlanMutationVariables = Exact<{
  input: UpdatePaymentPlanInput;
}>;


export type UpdatePaymentPlanMutation = { __typename?: 'Mutation', updatePaymentPlan?: { __typename?: 'PaymentPlan', allows_date_change?: boolean | null | undefined, cash_discount_amount?: number | null | undefined, cash_discount_percentage?: number | null | undefined, cash_final_amount?: number | null | undefined, cash_payment_deadline?: string | null | undefined, cash_payment_methods?: Array<string> | null | undefined, change_deadline_days?: number | null | undefined, created_at: string, currency: string, id: string, installment_amount_per_payment?: number | null | undefined, installment_available_days?: number | null | undefined, installment_down_payment_amount?: number | null | undefined, installment_down_payment_percentage?: number | null | undefined, installment_first_payment_deadline?: string | null | undefined, installment_frequency_days?: number | null | undefined, installment_number_of_payments?: number | null | undefined, installment_payment_deadline?: string | null | undefined, installment_payment_methods?: Array<string> | null | undefined, installment_total_amount?: number | null | undefined, product_id: string, reservation_date: string, reservation_id: string, total_cost: number, travel_date: string, updated_at: string, benefits_statements?: Array<{ __typename?: 'Statements', stated?: string | null | undefined }> | null | undefined } | null | undefined };

export type UpdateProductMutationVariables = Exact<{
  input: UpdateProductInput;
}>;


export type UpdateProductMutation = { __typename?: 'Mutation', updateProduct?: { __typename?: 'Product', cover_image_url?: string | null | undefined, created_at?: string | null | undefined, description?: string | null | undefined, id: string, image_url?: Array<string | null | undefined> | null | undefined, is_foreign?: boolean | null | undefined, itinerary?: string | null | undefined, languages?: Array<string | null | undefined> | null | undefined, min_product_price?: number | null | undefined, name?: string | null | undefined, planned_hotels_or_similar?: Array<string | null | undefined> | null | undefined, preferences?: Array<string | null | undefined> | null | undefined, product_type?: string | null | undefined, provider_id?: string | null | undefined, published?: boolean | null | undefined, status?: string | null | undefined, updated_at?: string | null | undefined, video_url?: Array<string | null | undefined> | null | undefined, departures?: Array<{ __typename?: 'GuaranteedDepartures', id?: string | null | undefined, specific_dates?: Array<string | null | undefined> | null | undefined, origin?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined } | null | undefined> | null | undefined, destination?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined, payment_policy?: { __typename?: 'PaymentPolicy', created_at: string, id: string, product_id: string, provider_id: string, updated_at: string, version: number, general_policies: { __typename?: 'GeneralPolicies', change_policy?: { __typename?: 'ChangePolicy', allows_date_change: boolean, deadline_days_to_make_change: number } | null | undefined }, options: Array<{ __typename?: 'PaymentOption', description: string, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined, config: { __typename?: 'PaymentConfig', cash?: { __typename?: 'CashConfig', deadline_days_to_pay: number, discount: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined, installments?: { __typename?: 'InstallmentsConfig', days_before_must_be_settled: number, deadline_days_to_pay: number, down_payment_after: number, down_payment_before: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined } }> } | null | undefined, seasons?: Array<{ __typename?: 'ProductSeason', aditional_services?: string | null | undefined, allotment?: number | null | undefined, allotment_remain?: number | null | undefined, category?: string | null | undefined, end_date?: string | null | undefined, id: string, number_of_nights?: string | null | undefined, schedules?: string | null | undefined, start_date?: string | null | undefined, extra_prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined, prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined } | null | undefined> | null | undefined, user_data?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined };

export type UpdateProvidersPoliciesBySubMutationVariables = Exact<{
  providers_policies?: InputMaybe<Array<PolicyInput> | PolicyInput>;
}>;


export type UpdateProvidersPoliciesBySubMutation = { __typename?: 'Mutation', updateProvidersPoliciesBySUB?: Array<{ __typename?: 'Policy', policy?: string | null | undefined, title?: string | null | undefined } | null | undefined> | null | undefined };

export type UpdateReservationMutationVariables = Exact<{
  input?: InputMaybe<UpdateReservationInput>;
}>;


export type UpdateReservationMutation = { __typename?: 'Mutation', updateReservation?: { __typename?: 'Reservation', adults?: number | null | undefined, babys?: number | null | undefined, experience_id?: string | null | undefined, experience_type?: string | null | undefined, id: string, kids?: number | null | undefined, price_per_kid?: number | null | undefined, price_per_person?: number | null | undefined, reservationDate?: string | null | undefined, total_price?: number | null | undefined, companions?: { __typename?: 'HolderCompanions', birthday: string, country: string, family_name: string, gender: string, name: string, passport_number?: number | null | undefined } | null | undefined } | null | undefined };

export type GetAllActiveAndPublishedProductsQueryVariables = Exact<{
  filter?: InputMaybe<ProductFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
}>;


export type GetAllActiveAndPublishedProductsQuery = { __typename?: 'Query', getAllActiveAndPublishedProducts?: { __typename?: 'ProductConnection', nextToken?: string | null | undefined, total?: number | null | undefined, items?: Array<{ __typename?: 'Product', cover_image_url?: string | null | undefined, created_at?: string | null | undefined, description?: string | null | undefined, id: string, image_url?: Array<string | null | undefined> | null | undefined, is_foreign?: boolean | null | undefined, itinerary?: string | null | undefined, languages?: Array<string | null | undefined> | null | undefined, min_product_price?: number | null | undefined, name?: string | null | undefined, planned_hotels_or_similar?: Array<string | null | undefined> | null | undefined, preferences?: Array<string | null | undefined> | null | undefined, product_type?: string | null | undefined, provider_id?: string | null | undefined, published?: boolean | null | undefined, status?: string | null | undefined, updated_at?: string | null | undefined, video_url?: Array<string | null | undefined> | null | undefined, departures?: Array<{ __typename?: 'GuaranteedDepartures', id?: string | null | undefined, specific_dates?: Array<string | null | undefined> | null | undefined, origin?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined } | null | undefined> | null | undefined, destination?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined, payment_policy?: { __typename?: 'PaymentPolicy', created_at: string, id: string, product_id: string, provider_id: string, updated_at: string, version: number, general_policies: { __typename?: 'GeneralPolicies', change_policy?: { __typename?: 'ChangePolicy', allows_date_change: boolean, deadline_days_to_make_change: number } | null | undefined }, options: Array<{ __typename?: 'PaymentOption', description: string, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined, config: { __typename?: 'PaymentConfig', cash?: { __typename?: 'CashConfig', deadline_days_to_pay: number, discount: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined, installments?: { __typename?: 'InstallmentsConfig', days_before_must_be_settled: number, deadline_days_to_pay: number, down_payment_after: number, down_payment_before: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined } }> } | null | undefined, seasons?: Array<{ __typename?: 'ProductSeason', aditional_services?: string | null | undefined, allotment?: number | null | undefined, allotment_remain?: number | null | undefined, category?: string | null | undefined, end_date?: string | null | undefined, id: string, number_of_nights?: string | null | undefined, schedules?: string | null | undefined, start_date?: string | null | undefined, extra_prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined, prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined } | null | undefined> | null | undefined, user_data?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined> | null | undefined } | null | undefined };

export type GetAllActiveMomentsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllActiveMomentsQuery = { __typename?: 'Query', getAllActiveMoments?: Array<{ __typename?: 'Moment', audioUrl?: string | null | undefined, comments?: Array<string | null | undefined> | null | undefined, created_at?: string | null | undefined, description?: string | null | undefined, experienceLink?: string | null | undefined, id?: string | null | undefined, likeCount?: number | null | undefined, preferences?: Array<string | null | undefined> | null | undefined, resourceType?: string | null | undefined, resourceUrl?: Array<string | null | undefined> | null | undefined, saveCount?: number | null | undefined, status?: string | null | undefined, tags?: Array<string | null | undefined> | null | undefined, updated_at?: string | null | undefined, viewerHasLiked?: boolean | null | undefined, viewerHasSaved?: boolean | null | undefined, destination?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined, likes?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, saves?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, user_data?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined> | null | undefined };

export type GetAllActiveProductsByProviderQueryVariables = Exact<{
  filter?: InputMaybe<ProductFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
}>;


export type GetAllActiveProductsByProviderQuery = { __typename?: 'Query', getAllActiveProductsByProvider?: { __typename?: 'ProductConnection', nextToken?: string | null | undefined, total?: number | null | undefined, items?: Array<{ __typename?: 'Product', cover_image_url?: string | null | undefined, created_at?: string | null | undefined, description?: string | null | undefined, id: string, image_url?: Array<string | null | undefined> | null | undefined, is_foreign?: boolean | null | undefined, itinerary?: string | null | undefined, languages?: Array<string | null | undefined> | null | undefined, min_product_price?: number | null | undefined, name?: string | null | undefined, planned_hotels_or_similar?: Array<string | null | undefined> | null | undefined, preferences?: Array<string | null | undefined> | null | undefined, product_type?: string | null | undefined, provider_id?: string | null | undefined, published?: boolean | null | undefined, status?: string | null | undefined, updated_at?: string | null | undefined, video_url?: Array<string | null | undefined> | null | undefined, departures?: Array<{ __typename?: 'GuaranteedDepartures', id?: string | null | undefined, specific_dates?: Array<string | null | undefined> | null | undefined, origin?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined } | null | undefined> | null | undefined, destination?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined, payment_policy?: { __typename?: 'PaymentPolicy', created_at: string, id: string, product_id: string, provider_id: string, updated_at: string, version: number, general_policies: { __typename?: 'GeneralPolicies', change_policy?: { __typename?: 'ChangePolicy', allows_date_change: boolean, deadline_days_to_make_change: number } | null | undefined }, options: Array<{ __typename?: 'PaymentOption', description: string, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined, config: { __typename?: 'PaymentConfig', cash?: { __typename?: 'CashConfig', deadline_days_to_pay: number, discount: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined, installments?: { __typename?: 'InstallmentsConfig', days_before_must_be_settled: number, deadline_days_to_pay: number, down_payment_after: number, down_payment_before: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined } }> } | null | undefined, seasons?: Array<{ __typename?: 'ProductSeason', aditional_services?: string | null | undefined, allotment?: number | null | undefined, allotment_remain?: number | null | undefined, category?: string | null | undefined, end_date?: string | null | undefined, id: string, number_of_nights?: string | null | undefined, schedules?: string | null | undefined, start_date?: string | null | undefined, extra_prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined, prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined } | null | undefined> | null | undefined, user_data?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined> | null | undefined } | null | undefined };

export type GetAllCommentsByMomentIdQueryVariables = Exact<{
  moment_id: Scalars['ID']['input'];
}>;


export type GetAllCommentsByMomentIdQuery = { __typename?: 'Query', getAllCommentsByMomentID?: Array<{ __typename?: 'Comment', comment?: string | null | undefined, created_at?: string | null | undefined, id?: string | null | undefined, likeCount?: number | null | undefined, status?: string | null | undefined, updated_at?: string | null | undefined, viewerHasLiked?: boolean | null | undefined, user_data?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined> | null | undefined };

export type GetAllMomentsByFollowingQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllMomentsByFollowingQuery = { __typename?: 'Query', getAllMomentsByFollowing?: Array<{ __typename?: 'Moment', audioUrl?: string | null | undefined, comments?: Array<string | null | undefined> | null | undefined, created_at?: string | null | undefined, description?: string | null | undefined, experienceLink?: string | null | undefined, id?: string | null | undefined, likeCount?: number | null | undefined, preferences?: Array<string | null | undefined> | null | undefined, resourceType?: string | null | undefined, resourceUrl?: Array<string | null | undefined> | null | undefined, saveCount?: number | null | undefined, status?: string | null | undefined, tags?: Array<string | null | undefined> | null | undefined, updated_at?: string | null | undefined, viewerHasLiked?: boolean | null | undefined, viewerHasSaved?: boolean | null | undefined, destination?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined, likes?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, saves?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, user_data?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined> | null | undefined };

export type GetAllMomentsByMyPreferencesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllMomentsByMyPreferencesQuery = { __typename?: 'Query', getAllMomentsByMyPreferences?: Array<{ __typename?: 'Moment', audioUrl?: string | null | undefined, comments?: Array<string | null | undefined> | null | undefined, created_at?: string | null | undefined, description?: string | null | undefined, experienceLink?: string | null | undefined, id?: string | null | undefined, likeCount?: number | null | undefined, preferences?: Array<string | null | undefined> | null | undefined, resourceType?: string | null | undefined, resourceUrl?: Array<string | null | undefined> | null | undefined, saveCount?: number | null | undefined, status?: string | null | undefined, tags?: Array<string | null | undefined> | null | undefined, updated_at?: string | null | undefined, viewerHasLiked?: boolean | null | undefined, viewerHasSaved?: boolean | null | undefined, destination?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined, likes?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, saves?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, user_data?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined> | null | undefined };

export type GetAllMomentsByUserQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllMomentsByUserQuery = { __typename?: 'Query', getAllMomentsByUser?: Array<{ __typename?: 'Moment', audioUrl?: string | null | undefined, comments?: Array<string | null | undefined> | null | undefined, created_at?: string | null | undefined, description?: string | null | undefined, experienceLink?: string | null | undefined, id?: string | null | undefined, likeCount?: number | null | undefined, preferences?: Array<string | null | undefined> | null | undefined, resourceType?: string | null | undefined, resourceUrl?: Array<string | null | undefined> | null | undefined, saveCount?: number | null | undefined, status?: string | null | undefined, tags?: Array<string | null | undefined> | null | undefined, updated_at?: string | null | undefined, viewerHasLiked?: boolean | null | undefined, viewerHasSaved?: boolean | null | undefined, destination?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined, likes?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, saves?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, user_data?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined> | null | undefined };

export type GetAllProductsByEmailQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationInput>;
}>;


export type GetAllProductsByEmailQuery = { __typename?: 'Query', getAllProductsByEmail?: { __typename?: 'ProductConnection', nextToken?: string | null | undefined, total?: number | null | undefined, items?: Array<{ __typename?: 'Product', cover_image_url?: string | null | undefined, created_at?: string | null | undefined, description?: string | null | undefined, id: string, image_url?: Array<string | null | undefined> | null | undefined, is_foreign?: boolean | null | undefined, itinerary?: string | null | undefined, languages?: Array<string | null | undefined> | null | undefined, min_product_price?: number | null | undefined, name?: string | null | undefined, planned_hotels_or_similar?: Array<string | null | undefined> | null | undefined, preferences?: Array<string | null | undefined> | null | undefined, product_type?: string | null | undefined, provider_id?: string | null | undefined, published?: boolean | null | undefined, status?: string | null | undefined, updated_at?: string | null | undefined, video_url?: Array<string | null | undefined> | null | undefined, departures?: Array<{ __typename?: 'GuaranteedDepartures', id?: string | null | undefined, specific_dates?: Array<string | null | undefined> | null | undefined, origin?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined } | null | undefined> | null | undefined, destination?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined, payment_policy?: { __typename?: 'PaymentPolicy', created_at: string, id: string, product_id: string, provider_id: string, updated_at: string, version: number, general_policies: { __typename?: 'GeneralPolicies', change_policy?: { __typename?: 'ChangePolicy', allows_date_change: boolean, deadline_days_to_make_change: number } | null | undefined }, options: Array<{ __typename?: 'PaymentOption', description: string, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined, config: { __typename?: 'PaymentConfig', cash?: { __typename?: 'CashConfig', deadline_days_to_pay: number, discount: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined, installments?: { __typename?: 'InstallmentsConfig', days_before_must_be_settled: number, deadline_days_to_pay: number, down_payment_after: number, down_payment_before: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined } }> } | null | undefined, seasons?: Array<{ __typename?: 'ProductSeason', aditional_services?: string | null | undefined, allotment?: number | null | undefined, allotment_remain?: number | null | undefined, category?: string | null | undefined, end_date?: string | null | undefined, id: string, number_of_nights?: string | null | undefined, schedules?: string | null | undefined, start_date?: string | null | undefined, extra_prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined, prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined } | null | undefined> | null | undefined, user_data?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined> | null | undefined } | null | undefined };

export type GetBlockedUsersQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetBlockedUsersQuery = { __typename?: 'Query', getBlockedUsers: { __typename?: 'FriendshipConnection', nextToken?: string | null | undefined, total: number, items: Array<{ __typename?: 'Friendship', createdAt: string, friendId: string, id: string, initiatedBy: string, updatedAt: string, userId: string, friend?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, user?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined }> } };

export type GetConversationByIdQueryVariables = Exact<{
  conversationId: Scalars['ID']['input'];
}>;


export type GetConversationByIdQuery = { __typename?: 'Query', getConversationById: { __typename?: 'Conversation', createdAt: string, id: string, participantIds: Array<string>, participantUsernames: Array<string>, updatedAt: string, lastMessage?: { __typename?: 'LastMessage', content: string, senderId: string, timestamp: string } | null | undefined, participantTypes: Array<{ __typename?: 'ParticipantType', userId: string, userType: string }>, unreadCount?: Array<{ __typename?: 'UnreadCount', count?: number | null | undefined, userId?: string | null | undefined } | null | undefined> | null | undefined } };

export type GetConversationMessagesQueryVariables = Exact<{
  conversationId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetConversationMessagesQuery = { __typename?: 'Query', getConversationMessages: { __typename?: 'MessageConnection', nextToken?: string | null | undefined, items: Array<{ __typename?: 'Message', content: string, conversationId: string, createdAt: string, id: string, senderId: string, senderUsername: string, timestamp: string, metadata?: { __typename?: 'MessageMetadata', imageUrl?: string | null | undefined, location?: { __typename?: 'ChatLocation', lat: number, lng: number } | null | undefined } | null | undefined }> } };

export type GetMyConnectionsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<FriendshipStatus>;
}>;


export type GetMyConnectionsQuery = { __typename?: 'Query', getMyConnections: { __typename?: 'FriendshipConnection', nextToken?: string | null | undefined, total: number, items: Array<{ __typename?: 'Friendship', createdAt: string, friendId: string, id: string, initiatedBy: string, updatedAt: string, userId: string, friend?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, user?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined }> } };

export type GetMyFollowersQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetMyFollowersQuery = { __typename?: 'Query', getMyFollowers: { __typename?: 'FollowConnection', nextToken?: string | null | undefined, total: number, items: Array<{ __typename?: 'Follow', createdAt: string, followerId: string, followingId: string, id: string, notificationEnabled: boolean, follower?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, following?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined }> } };

export type GetMyFollowingQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetMyFollowingQuery = { __typename?: 'Query', getMyFollowing: { __typename?: 'FollowConnection', nextToken?: string | null | undefined, total: number, items: Array<{ __typename?: 'Follow', createdAt: string, followerId: string, followingId: string, id: string, notificationEnabled: boolean, follower?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, following?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined }> } };

export type GetMyStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyStatsQuery = { __typename?: 'Query', getMyStats: { __typename?: 'UserStats', blockedUsersCount: number, connectionsCount: number, followersCount: number, followingCount: number, pendingRequestsReceived: number, pendingRequestsSent: number, userId: string } };

export type GetOrCreateConversationQueryVariables = Exact<{
  participantId: Scalars['ID']['input'];
}>;


export type GetOrCreateConversationQuery = { __typename?: 'Query', getOrCreateConversation: { __typename?: 'Conversation', createdAt: string, id: string, participantIds: Array<string>, participantUsernames: Array<string>, updatedAt: string, lastMessage?: { __typename?: 'LastMessage', content: string, senderId: string, timestamp: string } | null | undefined, participantTypes: Array<{ __typename?: 'ParticipantType', userId: string, userType: string }>, unreadCount?: Array<{ __typename?: 'UnreadCount', count?: number | null | undefined, userId?: string | null | undefined } | null | undefined> | null | undefined } };

export type GetPaymentPlanQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetPaymentPlanQuery = { __typename?: 'Query', getPaymentPlan?: { __typename?: 'PaymentPlan', allows_date_change?: boolean | null | undefined, cash_discount_amount?: number | null | undefined, cash_discount_percentage?: number | null | undefined, cash_final_amount?: number | null | undefined, cash_payment_deadline?: string | null | undefined, cash_payment_methods?: Array<string> | null | undefined, change_deadline_days?: number | null | undefined, created_at: string, currency: string, id: string, installment_amount_per_payment?: number | null | undefined, installment_available_days?: number | null | undefined, installment_down_payment_amount?: number | null | undefined, installment_down_payment_percentage?: number | null | undefined, installment_first_payment_deadline?: string | null | undefined, installment_frequency_days?: number | null | undefined, installment_number_of_payments?: number | null | undefined, installment_payment_deadline?: string | null | undefined, installment_payment_methods?: Array<string> | null | undefined, installment_total_amount?: number | null | undefined, product_id: string, reservation_date: string, reservation_id: string, total_cost: number, travel_date: string, updated_at: string, benefits_statements?: Array<{ __typename?: 'Statements', stated?: string | null | undefined }> | null | undefined } | null | undefined };

export type GetPaymentPlanByReservationQueryVariables = Exact<{
  reservation_id: Scalars['ID']['input'];
}>;


export type GetPaymentPlanByReservationQuery = { __typename?: 'Query', getPaymentPlanByReservation?: { __typename?: 'PaymentPlan', allows_date_change?: boolean | null | undefined, cash_discount_amount?: number | null | undefined, cash_discount_percentage?: number | null | undefined, cash_final_amount?: number | null | undefined, cash_payment_deadline?: string | null | undefined, cash_payment_methods?: Array<string> | null | undefined, change_deadline_days?: number | null | undefined, created_at: string, currency: string, id: string, installment_amount_per_payment?: number | null | undefined, installment_available_days?: number | null | undefined, installment_down_payment_amount?: number | null | undefined, installment_down_payment_percentage?: number | null | undefined, installment_first_payment_deadline?: string | null | undefined, installment_frequency_days?: number | null | undefined, installment_number_of_payments?: number | null | undefined, installment_payment_deadline?: string | null | undefined, installment_payment_methods?: Array<string> | null | undefined, installment_total_amount?: number | null | undefined, product_id: string, reservation_date: string, reservation_id: string, total_cost: number, travel_date: string, updated_at: string, benefits_statements?: Array<{ __typename?: 'Statements', stated?: string | null | undefined }> | null | undefined } | null | undefined };

export type GetPendingConnectionRequestsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetPendingConnectionRequestsQuery = { __typename?: 'Query', getPendingConnectionRequests: { __typename?: 'FriendshipConnection', nextToken?: string | null | undefined, total: number, items: Array<{ __typename?: 'Friendship', createdAt: string, friendId: string, id: string, initiatedBy: string, updatedAt: string, userId: string, friend?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, user?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined }> } };

export type GetProductByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetProductByIdQuery = { __typename?: 'Query', getProductById?: { __typename?: 'Product', cover_image_url?: string | null | undefined, created_at?: string | null | undefined, description?: string | null | undefined, id: string, image_url?: Array<string | null | undefined> | null | undefined, is_foreign?: boolean | null | undefined, itinerary?: string | null | undefined, languages?: Array<string | null | undefined> | null | undefined, min_product_price?: number | null | undefined, name?: string | null | undefined, planned_hotels_or_similar?: Array<string | null | undefined> | null | undefined, preferences?: Array<string | null | undefined> | null | undefined, product_type?: string | null | undefined, provider_id?: string | null | undefined, published?: boolean | null | undefined, status?: string | null | undefined, updated_at?: string | null | undefined, video_url?: Array<string | null | undefined> | null | undefined, departures?: Array<{ __typename?: 'GuaranteedDepartures', id?: string | null | undefined, specific_dates?: Array<string | null | undefined> | null | undefined, origin?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined } | null | undefined> | null | undefined, destination?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined, payment_policy?: { __typename?: 'PaymentPolicy', created_at: string, id: string, product_id: string, provider_id: string, updated_at: string, version: number, general_policies: { __typename?: 'GeneralPolicies', change_policy?: { __typename?: 'ChangePolicy', allows_date_change: boolean, deadline_days_to_make_change: number } | null | undefined }, options: Array<{ __typename?: 'PaymentOption', description: string, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined, config: { __typename?: 'PaymentConfig', cash?: { __typename?: 'CashConfig', deadline_days_to_pay: number, discount: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined, installments?: { __typename?: 'InstallmentsConfig', days_before_must_be_settled: number, deadline_days_to_pay: number, down_payment_after: number, down_payment_before: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined } }> } | null | undefined, seasons?: Array<{ __typename?: 'ProductSeason', aditional_services?: string | null | undefined, allotment?: number | null | undefined, allotment_remain?: number | null | undefined, category?: string | null | undefined, end_date?: string | null | undefined, id: string, number_of_nights?: string | null | undefined, schedules?: string | null | undefined, start_date?: string | null | undefined, extra_prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined, prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined } | null | undefined> | null | undefined, user_data?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined };

export type GetProductsByTypeQueryVariables = Exact<{
  filter?: InputMaybe<ProductFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  product_type: Scalars['String']['input'];
}>;


export type GetProductsByTypeQuery = { __typename?: 'Query', getProductsByType?: { __typename?: 'ProductConnection', nextToken?: string | null | undefined, total?: number | null | undefined, items?: Array<{ __typename?: 'Product', cover_image_url?: string | null | undefined, created_at?: string | null | undefined, description?: string | null | undefined, id: string, image_url?: Array<string | null | undefined> | null | undefined, is_foreign?: boolean | null | undefined, itinerary?: string | null | undefined, languages?: Array<string | null | undefined> | null | undefined, min_product_price?: number | null | undefined, name?: string | null | undefined, planned_hotels_or_similar?: Array<string | null | undefined> | null | undefined, preferences?: Array<string | null | undefined> | null | undefined, product_type?: string | null | undefined, provider_id?: string | null | undefined, published?: boolean | null | undefined, status?: string | null | undefined, updated_at?: string | null | undefined, video_url?: Array<string | null | undefined> | null | undefined, departures?: Array<{ __typename?: 'GuaranteedDepartures', id?: string | null | undefined, specific_dates?: Array<string | null | undefined> | null | undefined, origin?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined } | null | undefined> | null | undefined, destination?: Array<{ __typename?: 'Location', complementary_description?: string | null | undefined, id?: string | null | undefined, place?: string | null | undefined, placeSub?: string | null | undefined, coordinates?: { __typename?: 'Point', latitude?: number | null | undefined, longitude?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined, payment_policy?: { __typename?: 'PaymentPolicy', created_at: string, id: string, product_id: string, provider_id: string, updated_at: string, version: number, general_policies: { __typename?: 'GeneralPolicies', change_policy?: { __typename?: 'ChangePolicy', allows_date_change: boolean, deadline_days_to_make_change: number } | null | undefined }, options: Array<{ __typename?: 'PaymentOption', description: string, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined, config: { __typename?: 'PaymentConfig', cash?: { __typename?: 'CashConfig', deadline_days_to_pay: number, discount: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined, installments?: { __typename?: 'InstallmentsConfig', days_before_must_be_settled: number, deadline_days_to_pay: number, down_payment_after: number, down_payment_before: number, benefits_or_legal?: Array<{ __typename?: 'Statements', stated?: string | null | undefined } | null | undefined> | null | undefined } | null | undefined } }> } | null | undefined, seasons?: Array<{ __typename?: 'ProductSeason', aditional_services?: string | null | undefined, allotment?: number | null | undefined, allotment_remain?: number | null | undefined, category?: string | null | undefined, end_date?: string | null | undefined, id: string, number_of_nights?: string | null | undefined, schedules?: string | null | undefined, start_date?: string | null | undefined, extra_prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined, prices?: Array<{ __typename?: 'ProductPrice', currency: string, id: string, max_adult: number, max_minor: number, price: number, room_name: string, children: Array<{ __typename?: 'ChildRange', child_price: number, max_minor_age: number, min_minor_age: number, name: string }> } | null | undefined> | null | undefined } | null | undefined> | null | undefined, user_data?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined> | null | undefined } | null | undefined };

export type GetProvidersPoliciesBySubQueryVariables = Exact<{ [key: string]: never; }>;


export type GetProvidersPoliciesBySubQuery = { __typename?: 'Query', getProvidersPoliciesBySub?: Array<{ __typename?: 'Policy', policy?: string | null | undefined, title?: string | null | undefined } | null | undefined> | null | undefined };

export type GetRelationshipStatusQueryVariables = Exact<{
  targetUserId: Scalars['ID']['input'];
}>;


export type GetRelationshipStatusQuery = { __typename?: 'Query', getRelationshipStatus: { __typename?: 'RelationshipStatus', canFollow: boolean, canSendRequest: boolean, isConnected: boolean, isFollower: boolean, isFollowing: boolean } };

export type GetReservationsBySubQueryVariables = Exact<{ [key: string]: never; }>;


export type GetReservationsBySubQuery = { __typename?: 'Query', getReservationsBySUB?: Array<{ __typename?: 'Reservation', adults?: number | null | undefined, babys?: number | null | undefined, experience_id?: string | null | undefined, experience_type?: string | null | undefined, id: string, kids?: number | null | undefined, price_per_kid?: number | null | undefined, price_per_person?: number | null | undefined, reservationDate?: string | null | undefined, total_price?: number | null | undefined, companions?: { __typename?: 'HolderCompanions', birthday: string, country: string, family_name: string, gender: string, name: string, passport_number?: number | null | undefined } | null | undefined } | null | undefined> | null | undefined };

export type GetSentConnectionRequestsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSentConnectionRequestsQuery = { __typename?: 'Query', getSentConnectionRequests: { __typename?: 'FriendshipConnection', nextToken?: string | null | undefined, total: number, items: Array<{ __typename?: 'Friendship', createdAt: string, friendId: string, id: string, initiatedBy: string, updatedAt: string, userId: string, friend?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, user?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined }> } };

export type GetUserByUsernameQueryVariables = Exact<{
  username: Scalars['String']['input'];
}>;


export type GetUserByUsernameQuery = { __typename?: 'Query', getUserByUsername?: { __typename?: 'CognitoUser', address?: string | null | undefined, birthdate?: string | null | undefined, budget?: string | null | undefined, cognito_sub?: string | null | undefined, created_at?: string | null | undefined, custom_attributes?: string | null | undefined, email?: string | null | undefined, email_verified?: boolean | null | undefined, family_name?: string | null | undefined, gender?: string | null | undefined, given_name?: string | null | undefined, have_a_passport?: boolean | null | undefined, have_a_visa?: boolean | null | undefined, id?: string | null | undefined, interest_rate?: string | null | undefined, last_sync?: string | null | undefined, locale?: string | null | undefined, name?: string | null | undefined, phone_number?: string | null | undefined, phone_number_verified?: boolean | null | undefined, profile_photo_path?: string | null | undefined, profile_preferences?: string | null | undefined, provider_is_approved?: boolean | null | undefined, req_special_services?: boolean | null | undefined, updated_at?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined, zoneinfo?: string | null | undefined, providers_policies?: { __typename?: 'Policy', policy?: string | null | undefined, title?: string | null | undefined } | null | undefined } | null | undefined };

export type GetUserStatsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetUserStatsQuery = { __typename?: 'Query', getUserStats: { __typename?: 'UserStats', blockedUsersCount: number, connectionsCount: number, followersCount: number, followingCount: number, pendingRequestsReceived: number, pendingRequestsSent: number, userId: string } };

export type ListMyConversationsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
}>;


export type ListMyConversationsQuery = { __typename?: 'Query', listMyConversations: { __typename?: 'ConversationConnection', nextToken?: string | null | undefined, items: Array<{ __typename?: 'Conversation', createdAt: string, id: string, participantIds: Array<string>, participantUsernames: Array<string>, updatedAt: string, lastMessage?: { __typename?: 'LastMessage', content: string, senderId: string, timestamp: string } | null | undefined, participantTypes: Array<{ __typename?: 'ParticipantType', userId: string, userType: string }>, unreadCount?: Array<{ __typename?: 'UnreadCount', count?: number | null | undefined, userId?: string | null | undefined } | null | undefined> | null | undefined }> } };

export type OnConnectionRequestAcceptedSubscriptionVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type OnConnectionRequestAcceptedSubscription = { __typename?: 'Subscription', onConnectionRequestAccepted?: { __typename?: 'Friendship', createdAt: string, friendId: string, id: string, initiatedBy: string, updatedAt: string, userId: string, friend?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, user?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined };

export type OnConnectionRequestReceivedSubscriptionVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type OnConnectionRequestReceivedSubscription = { __typename?: 'Subscription', onConnectionRequestReceived?: { __typename?: 'Friendship', createdAt: string, friendId: string, id: string, initiatedBy: string, updatedAt: string, userId: string, friend?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, user?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined };

export type OnMessageDeliveredSubscriptionVariables = Exact<{
  conversationId: Scalars['ID']['input'];
}>;


export type OnMessageDeliveredSubscription = { __typename?: 'Subscription', onMessageDelivered?: { __typename?: 'Message', content: string, conversationId: string, createdAt: string, id: string, senderId: string, senderUsername: string, timestamp: string, metadata?: { __typename?: 'MessageMetadata', imageUrl?: string | null | undefined, location?: { __typename?: 'ChatLocation', lat: number, lng: number } | null | undefined } | null | undefined } | null | undefined };

export type OnMessagesReadSubscriptionVariables = Exact<{
  conversationId: Scalars['ID']['input'];
}>;


export type OnMessagesReadSubscription = { __typename?: 'Subscription', onMessagesRead?: boolean | null | undefined };

export type OnNewFollowerSubscriptionVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type OnNewFollowerSubscription = { __typename?: 'Subscription', onNewFollower?: { __typename?: 'Follow', createdAt: string, followerId: string, followingId: string, id: string, notificationEnabled: boolean, follower?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined, following?: { __typename?: 'User', avatar_url?: string | null | undefined, bio?: string | null | undefined, email?: string | null | undefined, name?: string | null | undefined, sub?: string | null | undefined, user_type?: string | null | undefined, username?: string | null | undefined } | null | undefined } | null | undefined };

export type OnNewMessageSubscriptionVariables = Exact<{
  conversationId: Scalars['ID']['input'];
}>;


export type OnNewMessageSubscription = { __typename?: 'Subscription', onNewMessage?: { __typename?: 'Message', content: string, conversationId: string, createdAt: string, id: string, senderId: string, senderUsername: string, timestamp: string, metadata?: { __typename?: 'MessageMetadata', imageUrl?: string | null | undefined, location?: { __typename?: 'ChatLocation', lat: number, lng: number } | null | undefined } | null | undefined } | null | undefined };

export type OnUserBlockedSubscriptionVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type OnUserBlockedSubscription = { __typename?: 'Subscription', onUserBlocked?: boolean | null | undefined };
