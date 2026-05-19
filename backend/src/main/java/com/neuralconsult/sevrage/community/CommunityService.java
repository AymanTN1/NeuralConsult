package com.neuralconsult.sevrage.community;

import com.neuralconsult.sevrage.community.dto.CommunityActivityItemResponse;
import com.neuralconsult.sevrage.community.dto.CommunityChannelResponse;
import com.neuralconsult.sevrage.community.dto.CommunityCommentCreateRequest;
import com.neuralconsult.sevrage.community.dto.CommunityCommentResponse;
import com.neuralconsult.sevrage.community.dto.CommunityConnectionResponse;
import com.neuralconsult.sevrage.community.dto.CommunityConversationResponse;
import com.neuralconsult.sevrage.community.dto.CommunityDetailResponse;
import com.neuralconsult.sevrage.community.dto.CommunityDirectMessageRequest;
import com.neuralconsult.sevrage.community.dto.CommunityDirectMessageResponse;
import com.neuralconsult.sevrage.community.dto.CommunityMessageCreateRequest;
import com.neuralconsult.sevrage.community.dto.CommunityMessageResponse;
import com.neuralconsult.sevrage.community.dto.CommunityPostCreateRequest;
import com.neuralconsult.sevrage.community.dto.CommunityPostResponse;
import com.neuralconsult.sevrage.community.dto.CommunityProfileRequest;
import com.neuralconsult.sevrage.community.dto.CommunityProfileResponse;
import com.neuralconsult.sevrage.community.dto.CommunityReactionRequest;
import com.neuralconsult.sevrage.community.dto.CommunityServerCreateRequest;
import com.neuralconsult.sevrage.community.dto.CommunityServerResponse;
import com.neuralconsult.sevrage.community.dto.CommunityShareRequest;
import com.neuralconsult.sevrage.community.dto.CommunitySocialOverviewResponse;
import com.neuralconsult.sevrage.community.dto.CommunityUserProfileResponse;
import com.neuralconsult.sevrage.community.dto.CommunityUserSummaryResponse;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CommunityService {

  private static final int MAX_POST_TEXT_LENGTH = 5000;
  private static final int MAX_MESSAGE_LENGTH = 2400;
  private static final int MAX_BIO_LENGTH = 320;
  private static final int MAX_USERNAME_LENGTH = 40;
  private static final int MAX_IMAGE_LENGTH = 1_800_000;

  private final CommunityServerRepository serverRepository;
  private final CommunityChannelRepository channelRepository;
  private final CommunityMemberRepository memberRepository;
  private final CommunityMessageRepository messageRepository;
  private final CommunityPostRepository postRepository;
  private final CommunityPostCommentRepository commentRepository;
  private final CommunityPostReactionRepository reactionRepository;
  private final CommunityFollowRepository followRepository;
  private final CommunityConnectionRepository connectionRepository;
  private final CommunityDirectMessageRepository directMessageRepository;
  private final UserRepository userRepository;

  public CommunityService(CommunityServerRepository serverRepository,
                          CommunityChannelRepository channelRepository,
                          CommunityMemberRepository memberRepository,
                          CommunityMessageRepository messageRepository,
                          CommunityPostRepository postRepository,
                          CommunityPostCommentRepository commentRepository,
                          CommunityPostReactionRepository reactionRepository,
                          CommunityFollowRepository followRepository,
                          CommunityConnectionRepository connectionRepository,
                          CommunityDirectMessageRepository directMessageRepository,
                          UserRepository userRepository) {
    this.serverRepository = serverRepository;
    this.channelRepository = channelRepository;
    this.memberRepository = memberRepository;
    this.messageRepository = messageRepository;
    this.postRepository = postRepository;
    this.commentRepository = commentRepository;
    this.reactionRepository = reactionRepository;
    this.followRepository = followRepository;
    this.connectionRepository = connectionRepository;
    this.directMessageRepository = directMessageRepository;
    this.userRepository = userRepository;
  }

  @Transactional
  public CommunityServerResponse createServer(User user, CommunityServerCreateRequest request) {
    User actor = requireManagedUser(user);
    CommunityServer server = new CommunityServer();
    server.setName(requireText(request.name(), "Le nom de la communaute est obligatoire."));
    server.setDescription(trimToLength(request.description(), 1000));
    server.setCreatedByUser(actor);
    CommunityServer saved = serverRepository.save(server);

    CommunityMember owner = new CommunityMember();
    owner.setServer(saved);
    owner.setUser(actor);
    owner.setRole(CommunityMember.Role.OWNER);
    memberRepository.save(owner);

    CommunityChannel channel = new CommunityChannel();
    channel.setServer(saved);
    channel.setName("General");
    channel.setDescription("Salon principal de soutien et d'entraide.");
    channelRepository.save(channel);
    return toServerResponse(saved, actor);
  }

  @Transactional
  public List<CommunityServerResponse> listServers(User user) {
    User actor = requireManagedUser(user);
    return serverRepository.findAllByOrderByCreatedAtDesc().stream().map(server -> toServerResponse(server, actor)).toList();
  }

  @Transactional
  public CommunityServerResponse join(User user, UUID serverId) {
    User actor = requireManagedUser(user);
    CommunityServer server = serverRepository.findById(serverId).orElseThrow();
    memberRepository.findByServerAndUser(server, actor).orElseGet(() -> {
      CommunityMember member = new CommunityMember();
      member.setServer(server);
      member.setUser(actor);
      member.setRole(CommunityMember.Role.MEMBER);
      return memberRepository.save(member);
    });
    return toServerResponse(server, actor);
  }

  @Transactional
  public CommunityDetailResponse detail(User user, UUID serverId) {
    User actor = requireManagedUser(user);
    CommunityServer server = serverRepository.findById(serverId).orElseThrow();
    ensureMembership(server, actor);
    List<CommunityChannelResponse> channels = channelRepository.findAllByServerOrderByCreatedAtAsc(server).stream()
        .map(channel -> new CommunityChannelResponse(channel.getId(), channel.getName(), channel.getDescription(), channel.getChannelType().name()))
        .toList();
    List<CommunityMessageResponse> latestMessages = channelRepository.findAllByServerOrderByCreatedAtAsc(server).stream()
        .findFirst()
        .map(channel -> messageRepository.findAllByChannelOrderByCreatedAtAsc(channel).stream().map(this::toMessageResponse).toList())
        .orElse(List.of());
    return new CommunityDetailResponse(toServerResponse(server, actor), channels, latestMessages);
  }

  @Transactional
  public List<CommunityMessageResponse> listMessages(User user, UUID channelId) {
    User actor = requireManagedUser(user);
    CommunityChannel channel = channelRepository.findById(channelId).orElseThrow();
    ensureMembership(channel.getServer(), actor);
    return messageRepository.findAllByChannelOrderByCreatedAtAsc(channel).stream().map(this::toMessageResponse).toList();
  }

  @Transactional
  public CommunityMessageResponse postMessage(User user, UUID channelId, CommunityMessageCreateRequest request) {
    User actor = requireManagedUser(user);
    CommunityChannel channel = channelRepository.findById(channelId).orElseThrow();
    ensureMembership(channel.getServer(), actor);
    CommunityMessage message = new CommunityMessage();
    message.setChannel(channel);
    message.setAuthor(actor);
    message.setContent(requireText(request.content(), "Le message est obligatoire."));
    return toMessageResponse(messageRepository.save(message));
  }

  @Transactional
  public CommunitySocialOverviewResponse socialOverview(User user) {
    User actor = requireManagedUser(user);
    List<CommunityPostResponse> posts = postRepository.findTop120ByDeletedAtIsNullOrderByCreatedAtDesc().stream()
        .map(post -> toPostResponse(post, actor))
        .sorted(feedComparator())
        .limit(80)
        .toList();

    List<CommunityUserSummaryResponse> people = searchUsers(actor, null);
    List<CommunityConnectionResponse> pending = connectionRepository
        .findAllByReceiverAndStatusOrderByCreatedAtDesc(actor, CommunityConnection.Status.PENDING)
        .stream()
        .map(connection -> toConnectionResponse(connection, actor))
        .toList();
    List<CommunityUserSummaryResponse> friends = connectionRepository
        .findAllForUserByStatus(actor, CommunityConnection.Status.ACCEPTED)
        .stream()
        .map(connection -> counterpart(connection, actor))
        .map(friend -> toUserSummary(friend, actor))
        .toList();

    return new CommunitySocialOverviewResponse(
        toProfileResponse(actor),
        posts,
        listServers(actor),
        people,
        pending,
        friends,
        listConversations(actor),
        listActivity(actor)
    );
  }

  @Transactional
  public CommunityProfileResponse myProfile(User user) {
    return toProfileResponse(requireManagedUser(user));
  }

  @Transactional
  public CommunityProfileResponse updateMyProfile(User user, CommunityProfileRequest request) {
    User actor = requireManagedUser(user);
    String username = normalizeUsername(request.username());
    if (username == null) {
      throw new IllegalArgumentException("Choisissez un nom d'utilisateur pour rejoindre la communaute.");
    }
    userRepository.findByCommunityUsernameIgnoreCase(username)
        .filter(existing -> !existing.getId().equals(actor.getId()))
        .ifPresent(existing -> {
          throw new IllegalArgumentException("Ce nom d'utilisateur est deja utilise.");
        });

    actor.setCommunityUsername(username);
    actor.setCommunityAvatarUrl(normalizeImage(request.profilePhotoUrl()));
    actor.setCommunityBio(trimToLength(request.bio(), MAX_BIO_LENGTH));
    return toProfileResponse(userRepository.save(actor));
  }

  @Transactional
  public List<CommunityUserSummaryResponse> searchUsers(User user, String query) {
    User actor = requireManagedUser(user);
    String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
    return userRepository.findAll().stream()
        .filter(candidate -> !candidate.getId().equals(actor.getId()))
        .filter(User::isAccountEnabled)
        .filter(candidate -> !candidate.isAccountLocked())
        .filter(this::isCommunityVisibleUser)
        .filter(candidate -> normalizedQuery.isBlank() || matchesSearch(candidate, normalizedQuery))
        .sorted(searchComparator(normalizedQuery))
        .limit(normalizedQuery.isBlank() ? 18 : 32)
        .map(candidate -> toUserSummary(candidate, actor))
        .toList();
  }

  @Transactional
  public CommunityUserProfileResponse userProfile(User viewer, UUID targetUserId) {
    User actor = requireManagedUser(viewer);
    User target = userRepository.findById(targetUserId)
        .filter(this::isCommunityVisibleUser)
        .orElseThrow(() -> new IllegalArgumentException("Profil introuvable."));
    return new CommunityUserProfileResponse(
        toUserSummary(target, actor),
        trimToLength(target.getCommunityBio(), MAX_BIO_LENGTH),
        followRepository.countByFollowerAndActiveTrue(target),
        connectionRepository.findAllForUserByStatus(target, CommunityConnection.Status.ACCEPTED).size(),
        postRepository.findAllByAuthorAndDeletedAtIsNullOrderByCreatedAtDesc(target).stream()
            .map(post -> toPostResponse(post, actor))
            .toList()
    );
  }

  @Transactional
  public CommunityPostResponse createPost(User user, CommunityPostCreateRequest request) {
    User actor = requireManagedUser(user);
    String content = trimToLength(request.content(), MAX_POST_TEXT_LENGTH);
    String imageUrl = normalizeImage(request.imageUrl());
    if ((content == null || content.isBlank()) && imageUrl == null) {
      throw new IllegalArgumentException("Ajoutez un texte ou une photo avant de publier.");
    }

    CommunityPost post = new CommunityPost();
    post.setAuthor(actor);
    post.setContent(content != null ? content : "");
    post.setImageUrl(imageUrl);
    
    if (request.postType() != null) {
      try {
        post.setPostType(CommunityPost.PostType.valueOf(request.postType()));
      } catch (IllegalArgumentException e) {
        post.setPostType(CommunityPost.PostType.USER_POST);
      }
    }
    
    post.setSourceUrl(request.sourceUrl());
    post.setSourceLabel(request.sourceLabel());

    if (request.serverId() != null) {
      CommunityServer server = serverRepository.findById(request.serverId()).orElseThrow();
      ensureMembership(server, actor);
      post.setServer(server);
    }
    return toPostResponse(postRepository.save(post), actor);
  }

  @Transactional
  public CommunityPostResponse reactToPost(User user, UUID postId, CommunityReactionRequest request) {
    User actor = requireManagedUser(user);
    CommunityPost post = postRepository.findById(postId).orElseThrow();
    CommunityPostReaction.ReactionType type = parseReaction(request.type());
    CommunityPostReaction reaction = reactionRepository.findByPostAndUser(post, actor).orElseGet(() -> {
      CommunityPostReaction created = new CommunityPostReaction();
      created.setPost(post);
      created.setUser(actor);
      return created;
    });

    if (reaction.getType() == type) {
      reactionRepository.delete(reaction);
    } else {
      reaction.setType(type);
      reactionRepository.save(reaction);
    }
    return toPostResponse(post, actor);
  }

  @Transactional
  public CommunityPostResponse commentOnPost(User user, UUID postId, CommunityCommentCreateRequest request) {
    User actor = requireManagedUser(user);
    CommunityPost post = postRepository.findById(postId).orElseThrow();
    CommunityPostComment comment = new CommunityPostComment();
    comment.setPost(post);
    comment.setAuthor(actor);
    comment.setContent(requireText(request.content(), "Le commentaire est obligatoire."));
    commentRepository.save(comment);
    return toPostResponse(post, actor);
  }

  @Transactional
  public CommunityDirectMessageResponse sharePost(User user, UUID postId, CommunityShareRequest request) {
    User actor = requireManagedUser(user);
    if (request.counterpartId() == null) {
      throw new IllegalArgumentException("Choisissez un ami pour partager ce post.");
    }
    CommunityPost post = postRepository.findById(postId).orElseThrow();
    User counterpart = userRepository.findById(request.counterpartId()).orElseThrow();
    ensureFriends(actor, counterpart);

    CommunityDirectMessage message = new CommunityDirectMessage();
    message.setSender(actor);
    message.setRecipient(counterpart);
    message.setSharedPost(post);
    message.setContent(trimToLength(request.message(), MAX_MESSAGE_LENGTH));
    return toDirectMessageResponse(directMessageRepository.save(message), actor);
  }

  @Transactional
  public CommunityUserSummaryResponse toggleFollow(User user, UUID targetUserId) {
    User actor = requireManagedUser(user);
    User target = userRepository.findById(targetUserId).orElseThrow();
    if (target.getId().equals(actor.getId())) {
      throw new IllegalArgumentException("Vous ne pouvez pas vous suivre vous-meme.");
    }
    CommunityFollow follow = followRepository.findByFollowerAndFollowed(actor, target).orElseGet(() -> {
      CommunityFollow created = new CommunityFollow();
      created.setFollower(actor);
      created.setFollowed(target);
      return created;
    });
    follow.setActive(!follow.isActive());
    followRepository.save(follow);
    return toUserSummary(target, actor);
  }

  @Transactional
  public CommunityConnectionResponse sendConnectionRequest(User user, UUID targetUserId) {
    User actor = requireManagedUser(user);
    User target = userRepository.findById(targetUserId).orElseThrow();
    if (target.getId().equals(actor.getId())) {
      throw new IllegalArgumentException("Vous ne pouvez pas vous inviter vous-meme.");
    }
    CommunityConnection connection = connectionRepository.findBetween(actor, target).orElseGet(() -> {
      CommunityConnection created = new CommunityConnection();
      created.setRequester(actor);
      created.setReceiver(target);
      return created;
    });
    if (connection.getStatus() == CommunityConnection.Status.DECLINED) {
      connection.setRequester(actor);
      connection.setReceiver(target);
      connection.setStatus(CommunityConnection.Status.PENDING);
    }
    return toConnectionResponse(connectionRepository.save(connection), actor);
  }

  @Transactional
  public CommunityConnectionResponse acceptConnection(User user, UUID connectionId) {
    User actor = requireManagedUser(user);
    CommunityConnection connection = connectionRepository.findById(connectionId).orElseThrow();
    if (!connection.getReceiver().getId().equals(actor.getId())) {
      throw new IllegalArgumentException("Seul le destinataire peut accepter cette invitation.");
    }
    connection.setStatus(CommunityConnection.Status.ACCEPTED);
    return toConnectionResponse(connectionRepository.save(connection), actor);
  }

  @Transactional
  public CommunityConnectionResponse declineConnection(User user, UUID connectionId) {
    User actor = requireManagedUser(user);
    CommunityConnection connection = connectionRepository.findById(connectionId).orElseThrow();
    if (!connection.getReceiver().getId().equals(actor.getId())) {
      throw new IllegalArgumentException("Seul le destinataire peut refuser cette invitation.");
    }
    connection.setStatus(CommunityConnection.Status.DECLINED);
    return toConnectionResponse(connectionRepository.save(connection), actor);
  }

  @Transactional
  public List<CommunityDirectMessageResponse> directThread(User user, UUID counterpartId) {
    User actor = requireManagedUser(user);
    User counterpart = userRepository.findById(counterpartId).orElseThrow();
    ensureFriends(actor, counterpart);
    List<CommunityDirectMessage> messages = directMessageRepository.findThread(actor, counterpart);
    List<CommunityDirectMessage> newlyRead = messages.stream()
        .filter(message -> message.getRecipient().getId().equals(actor.getId()))
        .filter(message -> message.getReadAt() == null)
        .peek(message -> message.setReadAt(Instant.now()))
        .toList();
    if (!newlyRead.isEmpty()) {
      directMessageRepository.saveAll(newlyRead);
    }
    return messages.stream().map(message -> toDirectMessageResponse(message, actor)).toList();
  }

  @Transactional
  public CommunityDirectMessageResponse sendDirectMessage(User user, UUID counterpartId, CommunityDirectMessageRequest request) {
    User actor = requireManagedUser(user);
    User counterpart = userRepository.findById(counterpartId).orElseThrow();
    ensureFriends(actor, counterpart);
    CommunityDirectMessage message = new CommunityDirectMessage();
    message.setSender(actor);
    message.setRecipient(counterpart);
    message.setContent(requireBoundedText(request.content(), "Le message est obligatoire.", MAX_MESSAGE_LENGTH));
    return toDirectMessageResponse(directMessageRepository.save(message), actor);
  }

  @Transactional
  public List<CommunityConversationResponse> listConversations(User user) {
    User actor = requireManagedUser(user);
    List<User> friends = new ArrayList<>();
    try {
      List<CommunityConnection> connections = connectionRepository.findAllForUserByStatus(actor, CommunityConnection.Status.ACCEPTED);
      for (CommunityConnection conn : connections) {
        try {
          User f = counterpart(conn, actor);
          if (f != null) {
            friends.add(f);
          }
        } catch (Exception e) {
          // ignore bad connection reference
        }
      }
    } catch (Exception e) {
      // ignore connection list errors
    }

    List<CommunityDirectMessage> recentMessages = new ArrayList<>();
    try {
      recentMessages = directMessageRepository.findRecentForUser(actor);
    } catch (Exception e) {
      // ignore direct messages errors
    }

    List<CommunityConversationResponse> conversations = new ArrayList<>();
    for (User friend : friends) {
      try {
        conversations.add(toConversationResponse(actor, friend, recentMessages));
      } catch (Exception e) {
        // ignore bad conversations
      }
    }

    return conversations.stream()
        .sorted(Comparator.comparing(CommunityConversationResponse::lastMessageAt, Comparator.nullsLast(Comparator.reverseOrder())))
        .toList();
  }

  private List<CommunityActivityItemResponse> listActivity(User user) {
    List<CommunityActivityItemResponse> items = new ArrayList<>();
    
    try {
      List<CommunityPostComment> comments = commentRepository.findAllByPostAuthorOrderByCreatedAtDesc(user);
      for (CommunityPostComment comment : comments) {
        try {
          if (comment == null || comment.getAuthor() == null || comment.getPost() == null) {
            continue;
          }
          if (comment.getAuthor().getId().equals(user.getId())) {
            continue;
          }
          items.add(new CommunityActivityItemResponse(
              comment.getId(),
              "COMMENT",
              toUserSummary(comment.getAuthor(), user),
              comment.getPost().getId(),
              previewOf(comment.getPost().getContent()),
              comment.getContent(),
              comment.getCreatedAt()
          ));
        } catch (Exception e) {
          // ignore comment mapping failure
        }
      }
    } catch (Exception e) {
      // ignore comments list failure
    }

    try {
      List<CommunityPostReaction> reactions = reactionRepository.findAllByPostAuthorOrderByCreatedAtDesc(user);
      for (CommunityPostReaction reaction : reactions) {
        try {
          if (reaction == null || reaction.getUser() == null || reaction.getPost() == null) {
            continue;
          }
          if (reaction.getUser().getId().equals(user.getId())) {
            continue;
          }
          items.add(new CommunityActivityItemResponse(
              reaction.getId(),
              "LOVE",
              toUserSummary(reaction.getUser(), user),
              reaction.getPost().getId(),
              previewOf(reaction.getPost().getContent()),
              reaction.getType() != null ? reaction.getType().name() : "LOVE",
              reaction.getCreatedAt()
          ));
        } catch (Exception e) {
          // ignore reaction mapping failure
        }
      }
    } catch (Exception e) {
      // ignore reactions list failure
    }

    return items.stream()
        .sorted(Comparator.comparing(item -> item.createdAt() != null ? item.createdAt() : Instant.MIN, Comparator.reverseOrder()))
        .limit(80)
        .toList();
  }

  private void ensureMembership(CommunityServer server, User user) {
    memberRepository.findByServerAndUser(server, user).orElseThrow(() ->
        new IllegalArgumentException("Vous devez rejoindre cette communaute avant d'y acceder."));
  }

  private User requireManagedUser(User user) {
    return userRepository.findById(user.getId()).orElseThrow();
  }

  private void ensureFriends(User user, User counterpart) {
    CommunityConnection connection = connectionRepository.findBetween(user, counterpart).orElseThrow(() ->
        new IllegalArgumentException("Vous devez etre amis avant d'ouvrir une discussion."));
    if (connection.getStatus() != CommunityConnection.Status.ACCEPTED) {
      throw new IllegalArgumentException("L'invitation doit etre acceptee avant de discuter.");
    }
  }

  private CommunityServerResponse toServerResponse(CommunityServer server, User user) {
    CommunityMember member = memberRepository.findByServerAndUser(server, user).orElse(null);
    return new CommunityServerResponse(
        server.getId(),
        server.getName(),
        server.getDescription(),
        server.getVisibility() != null ? server.getVisibility().name() : "PUBLIC",
        server.getCreatedByUser() != null ? server.getCreatedByUser().getFullName() : "Admin",
        memberRepository.findAllByServerAndActiveTrue(server).size(),
        member != null,
        member != null ? member.getRole().name() : null,
        server.getCreatedAt()
    );
  }

  private CommunityMessageResponse toMessageResponse(CommunityMessage message) {
    return new CommunityMessageResponse(
        message.getId(),
        message.getChannel().getId(),
        safeName(message.getAuthor()),
        message.getContent(),
        message.getCreatedAt()
    );
  }

  private CommunityPostResponse toPostResponse(CommunityPost post, User viewer) {
    List<CommunityPostReaction> reactions = reactionRepository.findAllByPost(post);
    Map<String, Long> reactionCounts = new LinkedHashMap<>();
    for (CommunityPostReaction.ReactionType type : CommunityPostReaction.ReactionType.values()) {
      reactionCounts.put(type.name(), reactions.stream().filter(reaction -> reaction.getType() == type).count());
    }
    String myReaction = reactions.stream()
        .filter(reaction -> reaction.getUser() != null && reaction.getUser().getId().equals(viewer.getId()))
        .map(reaction -> reaction.getType() != null ? reaction.getType().name() : "LOVE")
        .findFirst()
        .orElse(null);
    List<CommunityCommentResponse> comments = commentRepository.findAllByPostOrderByCreatedAtAsc(post).stream()
        .map(this::toCommentResponse)
        .toList();
    return new CommunityPostResponse(
        post.getId(),
        toUserSummary(post.getAuthor(), viewer),
        post.getServer() != null ? post.getServer().getId() : null,
        post.getServer() != null ? post.getServer().getName() : "Pour vous",
        post.getContent(),
        post.getImageUrl(),
        post.getCreatedAt(),
        reactionCounts,
        myReaction,
        comments,
        post.getPostType() != null ? post.getPostType().name() : "USER_POST",
        post.getSourceUrl(),
        post.getSourceLabel()
    );
  }

  private CommunityCommentResponse toCommentResponse(CommunityPostComment comment) {
    return new CommunityCommentResponse(
        comment.getId(),
        comment.getAuthor() != null ? comment.getAuthor().getId() : null,
        comment.getAuthor() != null ? safeName(comment.getAuthor()) : "Utilisateur anonyme",
        comment.getAuthor() != null ? comment.getAuthor().getCommunityUsername() : null,
        comment.getAuthor() != null ? comment.getAuthor().getCommunityAvatarUrl() : null,
        comment.getAuthor() != null ? roleLabel(comment.getAuthor()) : "Patient",
        comment.getContent(),
        comment.getCreatedAt()
    );
  }

  private CommunityUserSummaryResponse toUserSummary(User target, User viewer) {
    if (target == null) {
      return new CommunityUserSummaryResponse(
          null,
          "Utilisateur anonyme",
          null,
          null,
          "Patient",
          null,
          null,
          false,
          "NONE",
          0L,
          0L,
          false
      );
    }
    return new CommunityUserSummaryResponse(
        target.getId(),
        safeName(target),
        target.getCommunityUsername(),
        target.getEmail(),
        roleLabel(target),
        target.getCommunityAvatarUrl(),
        trimToLength(target.getCommunityBio(), 120),
        viewer != null && followRepository.existsByFollowerAndFollowedAndActiveTrue(viewer, target),
        connectionStatus(viewer, target),
        followRepository.countByFollowedAndActiveTrue(target),
        postRepository.findAllByAuthorAndDeletedAtIsNullOrderByCreatedAtDesc(target).size(),
        target.isVerifiedBadge()
    );
  }

  private CommunityProfileResponse toProfileResponse(User user) {
    return new CommunityProfileResponse(
        user.getId(),
        safeName(user),
        user.getCommunityUsername(),
        roleLabel(user),
        user.getCommunityAvatarUrl(),
        trimToLength(user.getCommunityBio(), MAX_BIO_LENGTH),
        user.getCommunityUsername() != null && !user.getCommunityUsername().isBlank(),
        user.isVerifiedBadge()
    );
  }

  private CommunityConnectionResponse toConnectionResponse(CommunityConnection connection, User viewer) {
    return new CommunityConnectionResponse(
        connection.getId(),
        connection.getRequester() != null ? toUserSummary(connection.getRequester(), viewer) : null,
        connection.getReceiver() != null ? toUserSummary(connection.getReceiver(), viewer) : null,
        connection.getStatus() != null ? connection.getStatus().name() : "PENDING",
        connection.getCreatedAt()
    );
  }

  private CommunityConversationResponse toConversationResponse(User viewer, User friend, List<CommunityDirectMessage> recentMessages) {
    if (friend == null) {
      return new CommunityConversationResponse(
          null,
          "Utilisateur inconnu",
          null,
          null,
          "Patient",
          "Aucun message pour le moment.",
          null,
          false,
          "NOUVEAU",
          0L
      );
    }
    CommunityDirectMessage last = recentMessages.stream()
        .filter(message -> message.getSender() != null && message.getRecipient() != null)
        .filter(message -> message.getSender().getId().equals(friend.getId()) || message.getRecipient().getId().equals(friend.getId()))
        .findFirst()
        .orElse(null);
    long unreadCount = recentMessages.stream()
        .filter(message -> message.getSender() != null && message.getSender().getId().equals(friend.getId()))
        .filter(message -> message.getRecipient() != null && message.getRecipient().getId().equals(viewer.getId()))
        .filter(message -> message.getReadAt() == null)
        .count();
    return new CommunityConversationResponse(
        friend.getId(),
        safeName(friend),
        friend.getCommunityUsername(),
        friend.getCommunityAvatarUrl(),
        roleLabel(friend),
        last != null ? conversationPreview(last) : "Aucun message pour le moment.",
        last != null ? last.getCreatedAt() : null,
        last != null && last.getSender() != null && last.getSender().getId().equals(viewer.getId()),
        last != null ? messageStatus(last, viewer) : "NOUVEAU",
        unreadCount
    );
  }

  private CommunityDirectMessageResponse toDirectMessageResponse(CommunityDirectMessage message, User viewer) {
    CommunityPost sharedPost = message.getSharedPost();
    User sender = message.getSender();
    return new CommunityDirectMessageResponse(
        message.getId(),
        sender != null ? sender.getId() : null,
        sender != null ? safeName(sender) : "Utilisateur anonyme",
        sender != null ? sender.getCommunityUsername() : null,
        sender != null ? sender.getCommunityAvatarUrl() : null,
        message.getContent(),
        sharedPost != null ? sharedPost.getId() : null,
        sharedPost != null ? previewOf(sharedPost.getContent()) : null,
        sharedPost != null ? sharedPost.getImageUrl() : null,
        sharedPost != null ? safeName(sharedPost.getAuthor()) : null,
        message.getCreatedAt(),
        sender != null && sender.getId().equals(viewer.getId()),
        messageStatus(message, viewer)
    );
  }

  private User counterpart(CommunityConnection connection, User user) {
    if (connection == null) {
      return null;
    }
    try {
      User req = connection.getRequester();
      User rec = connection.getReceiver();
      if (req == null) {
        return rec;
      }
      if (rec == null) {
        return req;
      }
      return req.getId().equals(user.getId()) ? rec : req;
    } catch (Exception e) {
      return null;
    }
  }

  private String connectionStatus(User viewer, User target) {
    if (viewer == null || target == null) {
      return "NONE";
    }
    if (viewer.getId().equals(target.getId())) {
      return "SELF";
    }
    return connectionRepository.findBetween(viewer, target)
        .map(connection -> {
          if (connection.getStatus() == CommunityConnection.Status.ACCEPTED) {
            return "FRIEND";
          }
          if (connection.getStatus() == CommunityConnection.Status.PENDING) {
            return connection.getRequester() != null && connection.getRequester().getId().equals(viewer.getId()) ? "PENDING_SENT" : "PENDING_RECEIVED";
          }
          return "NONE";
        })
        .orElse("NONE");
  }

  private String messageStatus(CommunityDirectMessage message, User viewer) {
    User sender = message.getSender();
    if (sender == null || !sender.getId().equals(viewer.getId())) {
      return "RECU";
    }
    return message.getReadAt() != null ? "VU" : "ENVOYE";
  }

  private CommunityPostReaction.ReactionType parseReaction(String rawType) {
    if (rawType == null || rawType.isBlank()) {
      return CommunityPostReaction.ReactionType.LOVE;
    }
    return CommunityPostReaction.ReactionType.valueOf(rawType.trim().toUpperCase(Locale.ROOT));
  }

  private boolean isCommunityVisibleUser(User user) {
    if (user == null || user.getRoles() == null) {
      return false;
    }
    return user.getRoles().contains("ROLE_PATIENT") 
        || user.getRoles().contains("ROLE_USER") 
        || user.getRoles().contains("ROLE_DOCTOR")
        || user.getRoles().contains("ROLE_ADMIN");
  }

  private String roleLabel(User user) {
    if (user == null || user.getRoles() == null) {
      return "Patient";
    }
    if (user.getRoles().contains("ROLE_DOCTOR")) {
      return "Medecin";
    }
    if (user.getRoles().contains("ROLE_ADMIN")) {
      return "Admin";
    }
    return "Patient";
  }

  private String safeName(User user) {
    if (user == null) {
      return "Membre NeuralConsult";
    }
    if (user.getCommunityUsername() != null && !user.getCommunityUsername().isBlank()) {
      return "@" + user.getCommunityUsername();
    }
    if (user.getFullName() != null && !user.getFullName().isBlank()) {
      return user.getFullName();
    }
    if (user.getEmail() != null && user.getEmail().contains("@")) {
      return user.getEmail().substring(0, user.getEmail().indexOf('@'));
    }
    return "Membre NeuralConsult";
  }

  private boolean matchesSearch(User candidate, String query) {
    return normalize(candidate.getCommunityUsername()).contains(query)
        || normalize(candidate.getFullName()).contains(query)
        || normalize(candidate.getEmail()).contains(query);
  }

  private Comparator<User> searchComparator(String query) {
    return Comparator
        .comparing((User candidate) -> normalize(candidate.getCommunityUsername()).equals(query)).reversed()
        .thenComparing(candidate -> normalize(candidate.getCommunityUsername()).startsWith(query), Comparator.reverseOrder())
        .thenComparingLong(candidate -> followRepository.countByFollowedAndActiveTrue(candidate)).reversed()
        .thenComparing(this::safeName);
  }

  private Comparator<CommunityPostResponse> feedComparator() {
    return Comparator
        .comparing((CommunityPostResponse post) -> "OFFICIAL_NEWS".equals(post.postType())).reversed()
        .thenComparing((CommunityPostResponse post) -> post.author().following()).reversed()
        .thenComparingLong(this::engagementScore).reversed()
        .thenComparing(post -> post.createdAt() != null ? post.createdAt() : Instant.MIN, Comparator.reverseOrder());
  }

  private long engagementScore(CommunityPostResponse post) {
    long love = post.reactions().getOrDefault(CommunityPostReaction.ReactionType.LOVE.name(), 0L);
    long comments = post.comments().size();
    long total = post.reactions().values().stream().mapToLong(Long::longValue).sum();
    return (love * 3L) + (comments * 2L) + total;
  }

  private String normalize(String value) {
    return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
  }

  private String normalizeUsername(String raw) {
    if (raw == null) {
      return null;
    }
    String normalized = raw.trim().toLowerCase(Locale.ROOT)
        .replaceAll("[^a-z0-9._]", "_")
        .replaceAll("_+", "_");
    if (normalized.length() < 3) {
      throw new IllegalArgumentException("Le nom d'utilisateur doit contenir au moins 3 caracteres.");
    }
    if (normalized.length() > MAX_USERNAME_LENGTH) {
      normalized = normalized.substring(0, MAX_USERNAME_LENGTH);
    }
    return normalized;
  }

  private String normalizeImage(String value) {
    String normalized = trimToLength(value, MAX_IMAGE_LENGTH);
    if (normalized == null || normalized.isBlank()) {
      return null;
    }
    if (normalized.startsWith("data:image/") || normalized.startsWith("http://") || normalized.startsWith("https://")) {
      return normalized;
    }
    throw new IllegalArgumentException("Le format d'image n'est pas reconnu.");
  }

  private String previewOf(String content) {
    if (content == null || content.isBlank()) {
      return "Photo partagee";
    }
    return content.length() > 120 ? content.substring(0, 117) + "..." : content;
  }

  private String conversationPreview(CommunityDirectMessage message) {
    if (message.getSharedPost() != null && (message.getContent() == null || message.getContent().isBlank())) {
      return "Post partage";
    }
    if (message.getSharedPost() != null) {
      return message.getContent() + " · Post partage";
    }
    return message.getContent();
  }

  private String requireText(String value, String message) {
    return requireBoundedText(value, message, MAX_POST_TEXT_LENGTH);
  }

  private String requireBoundedText(String value, String message, int maxLength) {
    String trimmed = trimToLength(value, maxLength);
    if (trimmed == null || trimmed.isBlank()) {
      throw new IllegalArgumentException(message);
    }
    return trimmed;
  }

  private String trimToLength(String value, int maxLength) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
  }
}
