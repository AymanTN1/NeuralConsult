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
import com.neuralconsult.sevrage.notification.NotificationItem;
import com.neuralconsult.sevrage.notification.NotificationService;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
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
  private final CommunityCommentReactionRepository commentReactionRepository;
  private final CommunityFollowRepository followRepository;
  private final CommunityConnectionRepository connectionRepository;
  private final CommunityDirectMessageRepository directMessageRepository;
  private final UserRepository userRepository;
  private final NotificationService notificationService;

  public CommunityService(CommunityServerRepository serverRepository,
                          CommunityChannelRepository channelRepository,
                          CommunityMemberRepository memberRepository,
                          CommunityMessageRepository messageRepository,
                          CommunityPostRepository postRepository,
                          CommunityPostCommentRepository commentRepository,
                          CommunityPostReactionRepository reactionRepository,
                          CommunityCommentReactionRepository commentReactionRepository,
                          CommunityFollowRepository followRepository,
                          CommunityConnectionRepository connectionRepository,
                          CommunityDirectMessageRepository directMessageRepository,
                          UserRepository userRepository,
                          NotificationService notificationService) {
    this.serverRepository = serverRepository;
    this.channelRepository = channelRepository;
    this.memberRepository = memberRepository;
    this.messageRepository = messageRepository;
    this.postRepository = postRepository;
    this.commentRepository = commentRepository;
    this.reactionRepository = reactionRepository;
    this.commentReactionRepository = commentReactionRepository;
    this.followRepository = followRepository;
    this.connectionRepository = connectionRepository;
    this.directMessageRepository = directMessageRepository;
    this.userRepository = userRepository;
    this.notificationService = notificationService;
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
        .limit(normalizedQuery.isBlank() ? 24 : 36)
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
        followRepository.countByFollowedAndActiveTrue(target),
        connectionRepository.findAllForUserByStatus(target, CommunityConnection.Status.ACCEPTED).size(),
        calculateKarma(target),
        calculateSmokeFreeStatus(target),
        postRepository.findAllByAuthorAndDeletedAtIsNullOrderByCreatedAtDesc(target).stream()
            .map(post -> toPostResponse(post, actor))
            .toList()
    );
  }

  @Transactional
  public CommunityUserProfileResponse userProfileByUsername(User viewer, String rawUsername) {
    User actor = requireManagedUser(viewer);
    String username = normalize(rawUsername).replace("@", "");
    User target = userRepository.findByCommunityUsernameIgnoreCase(username)
        .filter(this::isCommunityVisibleUser)
        .orElseThrow(() -> new IllegalArgumentException("Aucun utilisateur trouvé avec le pseudo @" + username));
    return userProfile(actor, target.getId());
  }

  @Transactional
  public CommunityPostResponse createPost(User user, CommunityPostCreateRequest request) {
    User actor = requireManagedUser(user);
    String content = trimToLength(request.content(), MAX_POST_TEXT_LENGTH);
    String imageUrl = normalizeImage(request.imageUrl());
    String title = trimToLength(request.title(), 280);
    String flair = trimToLength(request.flair(), 80);

    CommunityPost repostOf = null;
    if (request.repostOfPostId() != null) {
      repostOf = postRepository.findById(request.repostOfPostId()).orElse(null);
    }

    if ((content == null || content.isBlank()) && imageUrl == null && repostOf == null) {
      throw new IllegalArgumentException("Ajoutez un titre, un texte ou une photo avant de publier.");
    }

    CommunityPost post = new CommunityPost();
    post.setAuthor(actor);
    post.setTitle(title);
    post.setFlair(flair != null && !flair.isBlank() ? flair : "💡 Entraide");
    post.setContent(content != null ? content : "");
    post.setImageUrl(imageUrl);
    post.setRepostOfPost(repostOf);
    post.setRepostComment(trimToLength(request.repostComment(), 1000));
    
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
    CommunityPost saved = postRepository.save(post);

    // Notify original author if this is a repost
    if (repostOf != null && repostOf.getAuthor() != null && !repostOf.getAuthor().getId().equals(actor.getId())) {
      notificationService.notify(
          repostOf.getAuthor(),
          NotificationItem.Type.COMMUNITY,
          "Publication republiée",
          "@" + safeUsername(actor) + " a republié votre post.",
          "/communities?post=" + saved.getId(),
          "Voir le repost",
          "repost-" + saved.getId()
      );
    }

    return toPostResponse(saved, actor);
  }

  @Transactional
  public void deletePost(User user, UUID postId) {
    User actor = requireManagedUser(user);
    CommunityPost post = postRepository.findById(postId)
        .orElseThrow(() -> new IllegalArgumentException("Publication introuvable"));
    boolean isAuthor = post.getAuthor().getId().equals(actor.getId());
    boolean isPrivileged = actor.getRole() == com.neuralconsult.sevrage.user.UserRole.DOCTOR 
        || actor.getRole() == com.neuralconsult.sevrage.user.UserRole.ADMIN;
    if (!isAuthor && !isPrivileged) {
      throw new IllegalArgumentException("Vous n'êtes pas autorisé à supprimer cette publication.");
    }
    post.markDeleted(actor.getEmail());
    postRepository.save(post);
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

      // Notify post author
      if (post.getAuthor() != null && !post.getAuthor().getId().equals(actor.getId())) {
        notificationService.notify(
            post.getAuthor(),
            NotificationItem.Type.COMMUNITY,
            "Réaction sur votre publication",
            "@" + safeUsername(actor) + " a réagi (" + type.name() + ") à votre publication.",
            "/communities?post=" + post.getId(),
            "Voir la publication",
            "post-react-" + post.getId() + "-" + actor.getId()
        );
      }
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

    if (request.parentCommentId() != null) {
      commentRepository.findById(request.parentCommentId()).ifPresent(parent -> {
        comment.setParentComment(parent);
        // Notify parent comment author
        if (parent.getAuthor() != null && !parent.getAuthor().getId().equals(actor.getId())) {
          notificationService.notify(
              parent.getAuthor(),
              NotificationItem.Type.COMMUNITY,
              "Réponse à votre commentaire",
              "@" + safeUsername(actor) + " a répondu à votre commentaire : \"" + trimToLength(comment.getContent(), 60) + "\"",
              "/communities?post=" + post.getId(),
              "Voir la réponse",
              null
          );
        }
      });
    }

    CommunityPostComment savedComment = commentRepository.save(comment);

    // Notify post author
    if (post.getAuthor() != null && !post.getAuthor().getId().equals(actor.getId())) {
      notificationService.notify(
          post.getAuthor(),
          NotificationItem.Type.COMMUNITY,
          "Nouveau commentaire",
          "@" + safeUsername(actor) + " a commenté votre post : \"" + trimToLength(savedComment.getContent(), 60) + "\"",
          "/communities?post=" + post.getId(),
          "Voir la discussion",
          null
      );
    }

    return toPostResponse(post, actor);
  }

  @Transactional
  public CommunityCommentResponse reactToComment(User user, UUID commentId, CommunityReactionRequest request) {
    User actor = requireManagedUser(user);
    CommunityPostComment comment = commentRepository.findById(commentId).orElseThrow();
    CommunityPostReaction.ReactionType type = parseReaction(request.type());

    CommunityCommentReaction reaction = commentReactionRepository.findByCommentAndUser(comment, actor).orElseGet(() -> {
      CommunityCommentReaction created = new CommunityCommentReaction();
      created.setComment(comment);
      created.setUser(actor);
      return created;
    });

    if (reaction.getType() == type) {
      commentReactionRepository.delete(reaction);
    } else {
      reaction.setType(type);
      commentReactionRepository.save(reaction);

      // Notify comment author
      if (comment.getAuthor() != null && !comment.getAuthor().getId().equals(actor.getId())) {
        notificationService.notify(
            comment.getAuthor(),
            NotificationItem.Type.COMMUNITY,
            "Réaction sur votre commentaire",
            "@" + safeUsername(actor) + " a aimé votre commentaire.",
            "/communities?post=" + (comment.getPost() != null ? comment.getPost().getId() : ""),
            "Voir le commentaire",
            "comment-react-" + comment.getId() + "-" + actor.getId()
        );
      }
    }
    return toCommentResponse(comment, actor);
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

    if (follow.isActive()) {
      notificationService.notify(
          target,
          NotificationItem.Type.COMMUNITY,
          "Nouvel abonné",
          "@" + safeUsername(actor) + " a commencé à vous suivre.",
          "/communities?user=" + actor.getId(),
          "Voir le profil",
          "user-follow-" + actor.getId() + "-" + target.getId()
      );
    }
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
    connection.setStatus(CommunityConnection.Status.PENDING);
    CommunityConnection saved = connectionRepository.save(connection);

    notificationService.notify(
        target,
        NotificationItem.Type.COMMUNITY,
        "Nouvelle demande d'ami",
        "@" + safeUsername(actor) + " souhaite se connecter avec vous.",
        "/communities",
        "Voir les invitations",
        "conn-req-" + saved.getId()
    );

    return toConnectionResponse(saved, actor);
  }

  @Transactional
  public CommunityConnectionResponse acceptConnection(User user, UUID connectionId) {
    User actor = requireManagedUser(user);
    CommunityConnection connection = connectionRepository.findById(connectionId).orElseThrow();
    if (!connection.getReceiver().getId().equals(actor.getId())) {
      throw new IllegalArgumentException("Vous n'etes pas autorise a accepter cette invitation.");
    }
    connection.setStatus(CommunityConnection.Status.ACCEPTED);
    CommunityConnection saved = connectionRepository.save(connection);

    notificationService.notify(
        connection.getRequester(),
        NotificationItem.Type.COMMUNITY,
        "Invitation acceptée",
        "@" + safeUsername(actor) + " a accepté votre demande de connexion.",
        "/communities",
        "Ouvrir la discussion",
        "conn-acc-" + saved.getId()
    );

    return toConnectionResponse(saved, actor);
  }

  @Transactional
  public CommunityConnectionResponse declineConnection(User user, UUID connectionId) {
    User actor = requireManagedUser(user);
    CommunityConnection connection = connectionRepository.findById(connectionId).orElseThrow();
    if (!connection.getReceiver().getId().equals(actor.getId())) {
      throw new IllegalArgumentException("Vous n'etes pas autorise a refuser cette invitation.");
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
    CommunityDirectMessage saved = directMessageRepository.save(message);

    notificationService.notify(
        counterpart,
        NotificationItem.Type.COMMUNITY,
        "Nouveau message privé",
        "@" + safeUsername(actor) + " : \"" + trimToLength(saved.getContent(), 50) + "\"",
        "/communities?chat=" + actor.getId(),
        "Répondre",
        null
    );

    return toDirectMessageResponse(saved, actor);
  }

  @Transactional
  public List<CommunityConversationResponse> listConversations(User user) {
    User actor = requireManagedUser(user);
    Set<UUID> partnerIds = new LinkedHashSet<>();
    List<User> conversationPartners = new ArrayList<>();

    try {
      List<CommunityConnection> connections = connectionRepository.findAllForUserByStatus(actor, CommunityConnection.Status.ACCEPTED);
      for (CommunityConnection conn : connections) {
        try {
          User f = counterpart(conn, actor);
          if (f != null && partnerIds.add(f.getId())) {
            conversationPartners.add(f);
          }
        } catch (Exception e) {
          // ignore
        }
      }
    } catch (Exception e) {
      // ignore
    }

    List<CommunityDirectMessage> recentMessages = new ArrayList<>();
    try {
      recentMessages = directMessageRepository.findRecentForUser(actor);
      for (CommunityDirectMessage msg : recentMessages) {
        if (msg.getSender() != null && !msg.getSender().getId().equals(actor.getId()) && partnerIds.add(msg.getSender().getId())) {
          conversationPartners.add(msg.getSender());
        }
        if (msg.getRecipient() != null && !msg.getRecipient().getId().equals(actor.getId()) && partnerIds.add(msg.getRecipient().getId())) {
          conversationPartners.add(msg.getRecipient());
        }
      }
    } catch (Exception e) {
      // ignore
    }

    List<CommunityConversationResponse> conversations = new ArrayList<>();
    for (User partner : conversationPartners) {
      try {
        conversations.add(toConversationResponse(actor, partner, recentMessages));
      } catch (Exception e) {
        // ignore
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
        if (comment == null || comment.getAuthor() == null || comment.getPost() == null || comment.getAuthor().getId().equals(user.getId())) {
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
      }
    } catch (Exception ignored) {}

    try {
      List<CommunityPostReaction> reactions = reactionRepository.findAllByPostAuthorOrderByCreatedAtDesc(user);
      for (CommunityPostReaction reaction : reactions) {
        if (reaction == null || reaction.getUser() == null || reaction.getPost() == null || reaction.getUser().getId().equals(user.getId())) {
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
      }
    } catch (Exception ignored) {}

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
    if (user == null || counterpart == null) {
      throw new IllegalArgumentException("Utilisateur invalide.");
    }
    if (user.getId().equals(counterpart.getId())) {
      throw new IllegalArgumentException("Vous ne pouvez pas démarrer une discussion avec vous-même.");
    }
    CommunityConnection connection = connectionRepository.findBetween(user, counterpart).orElse(null);
    if (connection == null) {
      connection = new CommunityConnection();
      connection.setRequester(user);
      connection.setReceiver(counterpart);
      connection.setStatus(CommunityConnection.Status.ACCEPTED);
      connectionRepository.save(connection);
    } else if (connection.getStatus() != CommunityConnection.Status.ACCEPTED) {
      connection.setStatus(CommunityConnection.Status.ACCEPTED);
      connectionRepository.save(connection);
    }
  }

  private CommunityServerResponse toServerResponse(CommunityServer server, User user) {
    CommunityMember member = memberRepository.findByServerAndUser(server, user).orElse(null);
    String creatorName = "Admin";
    if (server.getCreatedByUser() != null) {
      creatorName = safeName(server.getCreatedByUser());
    }
    int memberCount = memberRepository.findAllByServerAndActiveTrue(server).size();

    return new CommunityServerResponse(
        server.getId(),
        server.getName(),
        server.getDescription(),
        server.getVisibility() != null ? server.getVisibility().name() : "PUBLIC",
        creatorName,
        memberCount,
        member != null,
        member != null ? member.getRole().name() : null,
        server.getCreatedAt()
    );
  }

  private CommunityMessageResponse toMessageResponse(CommunityMessage message) {
    return new CommunityMessageResponse(
        message.getId(),
        message.getChannel() != null ? message.getChannel().getId() : null,
        safeName(message.getAuthor()),
        message.getContent(),
        message.getCreatedAt()
    );
  }

  public CommunityPostResponse toPostResponse(CommunityPost post, User viewer) {
    try {
      List<CommunityPostReaction> reactions = reactionRepository.findAllByPost(post);
      Map<String, Long> reactionCounts = new LinkedHashMap<>();
      long upvotes = 0;
      long downvotes = 0;

      for (CommunityPostReaction.ReactionType type : CommunityPostReaction.ReactionType.values()) {
        long count = reactions.stream().filter(r -> r.getType() == type).count();
        reactionCounts.put(type.name(), count);
        if (type == CommunityPostReaction.ReactionType.UPVOTE || type == CommunityPostReaction.ReactionType.LIKE ||
            type == CommunityPostReaction.ReactionType.LOVE || type == CommunityPostReaction.ReactionType.FIRE ||
            type == CommunityPostReaction.ReactionType.CLAP || type == CommunityPostReaction.ReactionType.INSIGHT) {
          upvotes += count;
        } else if (type == CommunityPostReaction.ReactionType.DOWNVOTE) {
          downvotes += count;
        }
      }

      String myReaction = reactions.stream()
          .filter(r -> r.getUser() != null && r.getUser().getId().equals(viewer.getId()))
          .map(r -> r.getType() != null ? r.getType().name() : "LIKE")
          .findFirst()
          .orElse(null);

      List<CommunityCommentResponse> comments = commentRepository.findAllByPostOrderByCreatedAtAsc(post).stream()
          .map(c -> toCommentResponse(c, viewer))
          .toList();

      UUID serverId = post.getServer() != null ? post.getServer().getId() : null;
      String serverName = post.getServer() != null ? post.getServer().getName() : "r/general";

      CommunityPostResponse repostOf = null;
      if (post.getRepostOfPost() != null) {
        CommunityPost original = post.getRepostOfPost();
        repostOf = new CommunityPostResponse(
            original.getId(),
            toUserSummary(original.getAuthor(), viewer),
            original.getServer() != null ? original.getServer().getId() : null,
            original.getServer() != null ? original.getServer().getName() : "r/general",
            original.getTitle() != null ? original.getTitle() : "",
            original.getFlair() != null ? original.getFlair() : "💡 Partage",
            original.getContent(),
            original.getImageUrl(),
            original.getCreatedAt(),
            Map.of(),
            null,
            0,
            0,
            List.of(),
            original.getPostType() != null ? original.getPostType().name() : "USER_POST",
            original.getSourceUrl(),
            original.getSourceLabel(),
            null,
            null
        );
      }

      return new CommunityPostResponse(
          post.getId(),
          toUserSummary(post.getAuthor(), viewer),
          serverId,
          serverName,
          post.getTitle() != null ? post.getTitle() : "",
          post.getFlair() != null ? post.getFlair() : "💡 Entraide",
          post.getContent(),
          post.getImageUrl(),
          post.getCreatedAt(),
          reactionCounts,
          myReaction,
          upvotes,
          downvotes,
          comments,
          post.getPostType() != null ? post.getPostType().name() : "USER_POST",
          post.getSourceUrl(),
          post.getSourceLabel(),
          repostOf,
          post.getRepostComment()
      );
    } catch (Exception e) {
      return new CommunityPostResponse(
          post.getId(),
          anonymousUserSummary(),
          null,
          "r/general",
          "",
          "💡 Entraide",
          "Contenu indisponible",
          null,
          post.getCreatedAt(),
          Map.of(),
          null,
          0,
          0,
          List.of(),
          "USER_POST",
          null,
          null,
          null,
          null
      );
    }
  }

  public CommunityCommentResponse toCommentResponse(CommunityPostComment comment, User viewer) {
    try {
      User author = comment.getAuthor();
      if (author == null) {
        return anonymousCommentResponse(comment);
      }

      List<CommunityCommentReaction> reactions = commentReactionRepository.findAllByComment(comment);
      Map<String, Long> reactionCounts = new LinkedHashMap<>();
      long upvotes = 0;

      for (CommunityPostReaction.ReactionType type : CommunityPostReaction.ReactionType.values()) {
        long count = reactions.stream().filter(r -> r.getType() == type).count();
        if (count > 0) {
          reactionCounts.put(type.name(), count);
        }
        if (type == CommunityPostReaction.ReactionType.UPVOTE || type == CommunityPostReaction.ReactionType.LIKE ||
            type == CommunityPostReaction.ReactionType.LOVE || type == CommunityPostReaction.ReactionType.FIRE ||
            type == CommunityPostReaction.ReactionType.CLAP) {
          upvotes += count;
        }
      }

      String myReaction = reactions.stream()
          .filter(r -> r.getUser() != null && viewer != null && r.getUser().getId().equals(viewer.getId()))
          .map(r -> r.getType().name())
          .findFirst()
          .orElse(null);

      boolean isDoc = author.getRoles() != null && author.getRoles().contains("ROLE_DOCTOR");
      UUID parentId = comment.getParentComment() != null ? comment.getParentComment().getId() : null;

      return new CommunityCommentResponse(
          comment.getId(),
          author.getId(),
          safeName(author),
          safeUsername(author),
          author.getCommunityAvatarUrl(),
          roleLabel(author),
          author.isVerifiedBadge() || isDoc,
          comment.getContent(),
          comment.getCreatedAt(),
          parentId,
          reactionCounts,
          myReaction,
          upvotes
      );
    } catch (Exception e) {
      return anonymousCommentResponse(comment);
    }
  }

  private CommunityCommentResponse anonymousCommentResponse(CommunityPostComment comment) {
    return new CommunityCommentResponse(
        comment.getId(),
        null,
        "Membre anonyme",
        "anonyme",
        null,
        "Patient",
        false,
        comment.getContent(),
        comment.getCreatedAt(),
        null,
        Map.of(),
        null,
        0
    );
  }

  public CommunityUserSummaryResponse toUserSummary(User target, User viewer) {
    if (target == null) {
      return anonymousUserSummary();
    }
    try {
      boolean isDoc = target.getRoles() != null && target.getRoles().contains("ROLE_DOCTOR");
      String username = safeUsername(target);
      long followers = followRepository.countByFollowedAndActiveTrue(target);
      long following = followRepository.countByFollowerAndActiveTrue(target);
      long posts = postRepository.findAllByAuthorAndDeletedAtIsNullOrderByCreatedAtDesc(target).size();
      long karma = calculateKarma(target);
      String smokeStatus = calculateSmokeFreeStatus(target);

      return new CommunityUserSummaryResponse(
          target.getId(),
          safeName(target),
          username,
          isDoc ? target.getEmail() : null, // keep patient email hidden for privacy
          roleLabel(target),
          target.getCommunityAvatarUrl(),
          trimToLength(target.getCommunityBio(), 120),
          viewer != null && followRepository.existsByFollowerAndFollowedAndActiveTrue(viewer, target),
          connectionStatus(viewer, target),
          followers,
          following,
          posts,
          karma,
          smokeStatus,
          target.isVerifiedBadge() || isDoc,
          isDoc
      );
    } catch (Exception e) {
      return anonymousUserSummary();
    }
  }

  private CommunityUserSummaryResponse anonymousUserSummary() {
    return new CommunityUserSummaryResponse(
        null,
        "Membre anonyme",
        "anonyme",
        null,
        "Patient",
        null,
        null,
        false,
        "NONE",
        0L,
        0L,
        0L,
        0L,
        "Membre",
        false,
        false
    );
  }

  private CommunityProfileResponse toProfileResponse(User user) {
    return new CommunityProfileResponse(
        user.getId(),
        safeName(user),
        safeUsername(user),
        roleLabel(user),
        user.getCommunityAvatarUrl(),
        trimToLength(user.getCommunityBio(), MAX_BIO_LENGTH),
        user.getCommunityUsername() != null && !user.getCommunityUsername().isBlank(),
        user.isVerifiedBadge() || (user.getRoles() != null && user.getRoles().contains("ROLE_DOCTOR"))
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
        .filter(message -> {
          try {
            return message.getSender().getId().equals(friend.getId()) || message.getRecipient().getId().equals(friend.getId());
          } catch (Exception e) {
            return false;
          }
        })
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
        safeUsername(friend),
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
    UUID senderId = sender != null ? sender.getId() : null;
    String senderName = sender != null ? safeName(sender) : "Utilisateur anonyme";
    String senderUsername = sender != null ? safeUsername(sender) : null;
    String senderAvatar = sender != null ? sender.getCommunityAvatarUrl() : null;

    UUID sharedPostId = null;
    String sharedPostPreview = null;
    String sharedPostImage = null;
    String sharedPostAuthorName = null;

    if (sharedPost != null) {
      sharedPostId = sharedPost.getId();
      sharedPostPreview = previewOf(sharedPost.getContent());
      sharedPostImage = sharedPost.getImageUrl();
      sharedPostAuthorName = safeName(sharedPost.getAuthor());
    }

    return new CommunityDirectMessageResponse(
        message.getId(),
        senderId,
        senderName,
        senderUsername,
        senderAvatar,
        message.getContent(),
        sharedPostId,
        sharedPostPreview,
        sharedPostImage,
        sharedPostAuthorName,
        message.getCreatedAt(),
        senderId != null && senderId.equals(viewer.getId()),
        messageStatus(message, viewer)
    );
  }

  private User counterpart(CommunityConnection connection, User user) {
    if (connection == null) return null;
    User req = connection.getRequester();
    User rec = connection.getReceiver();
    if (req == null) return rec;
    if (rec == null) return req;
    return req.getId().equals(user.getId()) ? rec : req;
  }

  private String connectionStatus(User viewer, User target) {
    if (viewer == null || target == null) return "NONE";
    if (viewer.getId().equals(target.getId())) return "SELF";
    return connectionRepository.findBetween(viewer, target)
        .map(connection -> {
          if (connection.getStatus() == CommunityConnection.Status.ACCEPTED) return "FRIEND";
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
    try {
      return CommunityPostReaction.ReactionType.valueOf(rawType.trim().toUpperCase(Locale.ROOT));
    } catch (IllegalArgumentException e) {
      return CommunityPostReaction.ReactionType.LIKE;
    }
  }

  private boolean isCommunityVisibleUser(User user) {
    if (user == null || user.getRoles() == null) return false;
    return user.getRoles().contains("ROLE_PATIENT") 
        || user.getRoles().contains("ROLE_USER") 
        || user.getRoles().contains("ROLE_DOCTOR")
        || user.getRoles().contains("ROLE_ADMIN");
  }

  private String roleLabel(User user) {
    if (user == null || user.getRoles() == null) return "Patient";
    if (user.getRoles().contains("ROLE_DOCTOR")) return "Médecin Tabacologue";
    if (user.getRoles().contains("ROLE_ADMIN")) return "Modérateur";
    return "Patient";
  }

  public String safeName(User user) {
    if (user == null) return "Membre NeuralConsult";
    boolean isDoc = user.getRoles() != null && user.getRoles().contains("ROLE_DOCTOR");
    if (isDoc) {
      if (user.getFullName() != null && user.getFullName().startsWith("Dr.")) {
        return user.getFullName();
      }
      if (user.getLastName() != null && !user.getLastName().isBlank()) {
        return "Dr. " + user.getLastName();
      }
      if (user.getFullName() != null && !user.getFullName().isBlank()) {
        return "Dr. " + user.getFullName();
      }
    }
    // For patients: pseudonym only to preserve privacy!
    if (user.getCommunityUsername() != null && !user.getCommunityUsername().isBlank()) {
      return "@" + user.getCommunityUsername();
    }
    if (user.getId() != null) {
      return "@patient_" + user.getId().toString().substring(0, 6);
    }
    return "Membre Sevrage";
  }

  public String safeUsername(User user) {
    if (user == null) return "anonyme";
    if (user.getCommunityUsername() != null && !user.getCommunityUsername().isBlank()) {
      return user.getCommunityUsername();
    }
    if (user.getId() != null) {
      return "user_" + user.getId().toString().substring(0, 6);
    }
    return "membre";
  }

  private long calculateKarma(User user) {
    try {
      long postReactions = reactionRepository.countByPostAuthor(user);
      long commentReactions = commentReactionRepository.count(); // fallback approximate
      return (postReactions * 5L) + (commentReactions * 2L) + 12L;
    } catch (Exception e) {
      return 15L;
    }
  }

  private String calculateSmokeFreeStatus(User user) {
    if (user == null) return "Membre Sevrage";
    if (user.getRoles() != null && user.getRoles().contains("ROLE_DOCTOR")) {
      return "🩺 Tabacologue Praticien";
    }
    return "🌟 En parcours de sevrage";
  }

  private boolean matchesSearch(User candidate, String query) {
    return normalize(candidate.getCommunityUsername()).contains(query)
        || normalize(candidate.getFullName()).contains(query);
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
        .thenComparing((CommunityPostResponse post) -> post.author() != null && post.author().following()).reversed()
        .thenComparingLong(this::engagementScore).reversed()
        .thenComparing(post -> post.createdAt() != null ? post.createdAt() : Instant.MIN, Comparator.reverseOrder());
  }

  private long engagementScore(CommunityPostResponse post) {
    long upvotes = post.upvotesCount();
    long comments = post.comments() != null ? post.comments().size() : 0;
    return (upvotes * 3L) + (comments * 2L);
  }

  private String normalize(String value) {
    return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
  }

  private String normalizeUsername(String raw) {
    if (raw == null) return null;
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
    if (normalized == null || normalized.isBlank()) return null;
    if (normalized.startsWith("data:image/") || normalized.startsWith("http://") || normalized.startsWith("https://")) {
      return normalized;
    }
    throw new IllegalArgumentException("Le format d'image n'est pas reconnu.");
  }

  private String previewOf(String content) {
    if (content == null || content.isBlank()) return "Photo partagee";
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
    if (value == null) return null;
    String trimmed = value.trim();
    return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
  }
}
