package com.neuralconsult.sevrage.community;

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
import com.neuralconsult.sevrage.community.dto.CommunityReactionRequest;
import com.neuralconsult.sevrage.community.dto.CommunityServerCreateRequest;
import com.neuralconsult.sevrage.community.dto.CommunityServerResponse;
import com.neuralconsult.sevrage.community.dto.CommunitySocialOverviewResponse;
import com.neuralconsult.sevrage.community.dto.CommunityUserSummaryResponse;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class CommunityService {

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
    CommunityServer server = new CommunityServer();
    server.setName(requireText(request.name(), "Le nom de la communaute est obligatoire."));
    server.setDescription(trimToLength(request.description(), 1000));
    server.setCreatedByUser(user);
    CommunityServer saved = serverRepository.save(server);

    CommunityMember owner = new CommunityMember();
    owner.setServer(saved);
    owner.setUser(user);
    owner.setRole(CommunityMember.Role.OWNER);
    memberRepository.save(owner);

    CommunityChannel channel = new CommunityChannel();
    channel.setServer(saved);
    channel.setName("General");
    channel.setDescription("Salon principal de soutien et d'entraide.");
    channelRepository.save(channel);
    return toServerResponse(saved, user);
  }

  @Transactional
  public List<CommunityServerResponse> listServers(User user) {
    return serverRepository.findAllByOrderByCreatedAtDesc().stream().map(server -> toServerResponse(server, user)).toList();
  }

  @Transactional
  public CommunityServerResponse join(User user, UUID serverId) {
    CommunityServer server = serverRepository.findById(serverId).orElseThrow();
    memberRepository.findByServerAndUser(server, user).orElseGet(() -> {
      CommunityMember member = new CommunityMember();
      member.setServer(server);
      member.setUser(user);
      member.setRole(CommunityMember.Role.MEMBER);
      return memberRepository.save(member);
    });
    return toServerResponse(server, user);
  }

  @Transactional
  public CommunityDetailResponse detail(User user, UUID serverId) {
    CommunityServer server = serverRepository.findById(serverId).orElseThrow();
    ensureMembership(server, user);
    List<CommunityChannelResponse> channels = channelRepository.findAllByServerOrderByCreatedAtAsc(server).stream()
        .map(channel -> new CommunityChannelResponse(channel.getId(), channel.getName(), channel.getDescription(), channel.getChannelType().name()))
        .toList();
    List<CommunityMessageResponse> latestMessages = channelRepository.findAllByServerOrderByCreatedAtAsc(server).stream()
        .findFirst()
        .map(channel -> messageRepository.findAllByChannelOrderByCreatedAtAsc(channel).stream().map(this::toMessageResponse).toList())
        .orElse(List.of());
    return new CommunityDetailResponse(toServerResponse(server, user), channels, latestMessages);
  }

  @Transactional
  public List<CommunityMessageResponse> listMessages(User user, UUID channelId) {
    CommunityChannel channel = channelRepository.findById(channelId).orElseThrow();
    ensureMembership(channel.getServer(), user);
    return messageRepository.findAllByChannelOrderByCreatedAtAsc(channel).stream().map(this::toMessageResponse).toList();
  }

  @Transactional
  public CommunityMessageResponse postMessage(User user, UUID channelId, CommunityMessageCreateRequest request) {
    CommunityChannel channel = channelRepository.findById(channelId).orElseThrow();
    ensureMembership(channel.getServer(), user);
    CommunityMessage message = new CommunityMessage();
    message.setChannel(channel);
    message.setAuthor(user);
    message.setContent(requireText(request.content(), "Le message est obligatoire."));
    return toMessageResponse(messageRepository.save(message));
  }

  @Transactional
  public CommunitySocialOverviewResponse socialOverview(User user) {
    List<CommunityPostResponse> posts = postRepository.findTop60ByDeletedAtIsNullOrderByCreatedAtDesc().stream()
        .map(post -> toPostResponse(post, user))
        .toList();
    List<CommunityUserSummaryResponse> people = userRepository.findAll().stream()
        .filter(candidate -> !candidate.getId().equals(user.getId()))
        .filter(User::isAccountEnabled)
        .filter(candidate -> !candidate.isAccountLocked())
        .filter(this::isCommunityVisibleUser)
        .sorted(Comparator.comparing(this::safeName))
        .limit(16)
        .map(candidate -> toUserSummary(candidate, user))
        .toList();
    List<CommunityConnectionResponse> pending = connectionRepository
        .findAllByReceiverAndStatusOrderByCreatedAtDesc(user, CommunityConnection.Status.PENDING)
        .stream()
        .map(connection -> toConnectionResponse(connection, user))
        .toList();
    List<CommunityUserSummaryResponse> friends = connectionRepository
        .findAllForUserByStatus(user, CommunityConnection.Status.ACCEPTED)
        .stream()
        .map(connection -> counterpart(connection, user))
        .map(friend -> toUserSummary(friend, user))
        .toList();
    return new CommunitySocialOverviewResponse(
        posts,
        listServers(user),
        people,
        pending,
        friends,
        listConversations(user)
    );
  }

  @Transactional
  public CommunityPostResponse createPost(User user, CommunityPostCreateRequest request) {
    CommunityPost post = new CommunityPost();
    post.setAuthor(user);
    post.setContent(requireText(request.content(), "Le contenu du post est obligatoire."));
    if (request.serverId() != null) {
      CommunityServer server = serverRepository.findById(request.serverId()).orElseThrow();
      ensureMembership(server, user);
      post.setServer(server);
    }
    return toPostResponse(postRepository.save(post), user);
  }

  @Transactional
  public CommunityPostResponse reactToPost(User user, UUID postId, CommunityReactionRequest request) {
    CommunityPost post = postRepository.findById(postId).orElseThrow();
    CommunityPostReaction.ReactionType type = parseReaction(request.type());
    CommunityPostReaction reaction = reactionRepository.findByPostAndUser(post, user).orElseGet(() -> {
      CommunityPostReaction created = new CommunityPostReaction();
      created.setPost(post);
      created.setUser(user);
      return created;
    });
    reaction.setType(type);
    reactionRepository.save(reaction);
    return toPostResponse(post, user);
  }

  @Transactional
  public CommunityPostResponse commentOnPost(User user, UUID postId, CommunityCommentCreateRequest request) {
    CommunityPost post = postRepository.findById(postId).orElseThrow();
    CommunityPostComment comment = new CommunityPostComment();
    comment.setPost(post);
    comment.setAuthor(user);
    comment.setContent(requireText(request.content(), "Le commentaire est obligatoire."));
    commentRepository.save(comment);
    return toPostResponse(post, user);
  }

  @Transactional
  public CommunityUserSummaryResponse toggleFollow(User user, UUID targetUserId) {
    User target = userRepository.findById(targetUserId).orElseThrow();
    if (target.getId().equals(user.getId())) {
      throw new IllegalArgumentException("Vous ne pouvez pas vous suivre vous-meme.");
    }
    CommunityFollow follow = followRepository.findByFollowerAndFollowed(user, target).orElseGet(() -> {
      CommunityFollow created = new CommunityFollow();
      created.setFollower(user);
      created.setFollowed(target);
      return created;
    });
    follow.setActive(!follow.isActive());
    followRepository.save(follow);
    return toUserSummary(target, user);
  }

  @Transactional
  public CommunityConnectionResponse sendConnectionRequest(User user, UUID targetUserId) {
    User target = userRepository.findById(targetUserId).orElseThrow();
    if (target.getId().equals(user.getId())) {
      throw new IllegalArgumentException("Vous ne pouvez pas vous inviter vous-meme.");
    }
    CommunityConnection connection = connectionRepository.findBetween(user, target).orElseGet(() -> {
      CommunityConnection created = new CommunityConnection();
      created.setRequester(user);
      created.setReceiver(target);
      return created;
    });
    if (connection.getStatus() == CommunityConnection.Status.DECLINED) {
      connection.setRequester(user);
      connection.setReceiver(target);
      connection.setStatus(CommunityConnection.Status.PENDING);
    }
    return toConnectionResponse(connectionRepository.save(connection), user);
  }

  @Transactional
  public CommunityConnectionResponse acceptConnection(User user, UUID connectionId) {
    CommunityConnection connection = connectionRepository.findById(connectionId).orElseThrow();
    if (!connection.getReceiver().getId().equals(user.getId())) {
      throw new IllegalArgumentException("Seul le destinataire peut accepter cette invitation.");
    }
    connection.setStatus(CommunityConnection.Status.ACCEPTED);
    return toConnectionResponse(connectionRepository.save(connection), user);
  }

  @Transactional
  public CommunityConnectionResponse declineConnection(User user, UUID connectionId) {
    CommunityConnection connection = connectionRepository.findById(connectionId).orElseThrow();
    if (!connection.getReceiver().getId().equals(user.getId())) {
      throw new IllegalArgumentException("Seul le destinataire peut refuser cette invitation.");
    }
    connection.setStatus(CommunityConnection.Status.DECLINED);
    return toConnectionResponse(connectionRepository.save(connection), user);
  }

  @Transactional
  public List<CommunityDirectMessageResponse> directThread(User user, UUID counterpartId) {
    User counterpart = userRepository.findById(counterpartId).orElseThrow();
    ensureFriends(user, counterpart);
    List<CommunityDirectMessage> messages = directMessageRepository.findThread(user, counterpart);
    List<CommunityDirectMessage> newlyRead = messages.stream()
        .filter(message -> message.getRecipient().getId().equals(user.getId()))
        .filter(message -> message.getReadAt() == null)
        .peek(message -> message.setReadAt(Instant.now()))
        .toList();
    if (!newlyRead.isEmpty()) {
      directMessageRepository.saveAll(newlyRead);
    }
    return messages.stream().map(message -> toDirectMessageResponse(message, user)).toList();
  }

  @Transactional
  public CommunityDirectMessageResponse sendDirectMessage(User user, UUID counterpartId, CommunityDirectMessageRequest request) {
    User counterpart = userRepository.findById(counterpartId).orElseThrow();
    ensureFriends(user, counterpart);
    CommunityDirectMessage message = new CommunityDirectMessage();
    message.setSender(user);
    message.setRecipient(counterpart);
    message.setContent(requireText(request.content(), "Le message est obligatoire."));
    return toDirectMessageResponse(directMessageRepository.save(message), user);
  }

  @Transactional
  public List<CommunityConversationResponse> listConversations(User user) {
    List<User> friends = connectionRepository.findAllForUserByStatus(user, CommunityConnection.Status.ACCEPTED).stream()
        .map(connection -> counterpart(connection, user))
        .toList();
    List<CommunityDirectMessage> recentMessages = directMessageRepository.findRecentForUser(user);
    return friends.stream()
        .map(friend -> toConversationResponse(user, friend, recentMessages))
        .sorted(Comparator.comparing(CommunityConversationResponse::lastMessageAt, Comparator.nullsLast(Comparator.reverseOrder())))
        .toList();
  }

  private void ensureMembership(CommunityServer server, User user) {
    memberRepository.findByServerAndUser(server, user).orElseThrow(() ->
        new IllegalArgumentException("Vous devez rejoindre cette communaute avant d'y acceder."));
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
        server.getVisibility().name(),
        server.getCreatedByUser().getFullName(),
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
        .filter(reaction -> reaction.getUser().getId().equals(viewer.getId()))
        .map(reaction -> reaction.getType().name())
        .findFirst()
        .orElse(null);
    List<CommunityCommentResponse> comments = commentRepository.findAllByPostOrderByCreatedAtAsc(post).stream()
        .map(comment -> toCommentResponse(comment, viewer))
        .toList();
    return new CommunityPostResponse(
        post.getId(),
        toUserSummary(post.getAuthor(), viewer),
        post.getServer() != null ? post.getServer().getId() : null,
        post.getServer() != null ? post.getServer().getName() : "Fil general",
        post.getContent(),
        post.getCreatedAt(),
        reactionCounts,
        myReaction,
        comments
    );
  }

  private CommunityCommentResponse toCommentResponse(CommunityPostComment comment, User viewer) {
    return new CommunityCommentResponse(
        comment.getId(),
        comment.getAuthor().getId(),
        safeName(comment.getAuthor()),
        roleLabel(comment.getAuthor()),
        comment.getContent(),
        comment.getCreatedAt()
    );
  }

  private CommunityUserSummaryResponse toUserSummary(User target, User viewer) {
    return new CommunityUserSummaryResponse(
        target.getId(),
        safeName(target),
        target.getEmail(),
        roleLabel(target),
        followRepository.existsByFollowerAndFollowedAndActiveTrue(viewer, target),
        connectionStatus(viewer, target),
        followRepository.countByFollowedAndActiveTrue(target)
    );
  }

  private CommunityConnectionResponse toConnectionResponse(CommunityConnection connection, User viewer) {
    return new CommunityConnectionResponse(
        connection.getId(),
        toUserSummary(connection.getRequester(), viewer),
        toUserSummary(connection.getReceiver(), viewer),
        connection.getStatus().name(),
        connection.getCreatedAt()
    );
  }

  private CommunityConversationResponse toConversationResponse(User viewer, User friend, List<CommunityDirectMessage> recentMessages) {
    CommunityDirectMessage last = recentMessages.stream()
        .filter(message -> message.getSender().getId().equals(friend.getId()) || message.getRecipient().getId().equals(friend.getId()))
        .findFirst()
        .orElse(null);
    long unreadCount = recentMessages.stream()
        .filter(message -> message.getSender().getId().equals(friend.getId()))
        .filter(message -> message.getRecipient().getId().equals(viewer.getId()))
        .filter(message -> message.getReadAt() == null)
        .count();
    return new CommunityConversationResponse(
        friend.getId(),
        safeName(friend),
        roleLabel(friend),
        last != null ? last.getContent() : "Aucun message pour le moment.",
        last != null ? last.getCreatedAt() : null,
        last != null && last.getSender().getId().equals(viewer.getId()),
        last != null ? messageStatus(last, viewer) : "NOUVEAU",
        unreadCount
    );
  }

  private CommunityDirectMessageResponse toDirectMessageResponse(CommunityDirectMessage message, User viewer) {
    return new CommunityDirectMessageResponse(
        message.getId(),
        message.getSender().getId(),
        safeName(message.getSender()),
        message.getContent(),
        message.getCreatedAt(),
        message.getSender().getId().equals(viewer.getId()),
        messageStatus(message, viewer)
    );
  }

  private User counterpart(CommunityConnection connection, User user) {
    return connection.getRequester().getId().equals(user.getId()) ? connection.getReceiver() : connection.getRequester();
  }

  private String connectionStatus(User viewer, User target) {
    if (viewer.getId().equals(target.getId())) {
      return "SELF";
    }
    return connectionRepository.findBetween(viewer, target)
        .map(connection -> {
          if (connection.getStatus() == CommunityConnection.Status.ACCEPTED) {
            return "FRIEND";
          }
          if (connection.getStatus() == CommunityConnection.Status.PENDING) {
            return connection.getRequester().getId().equals(viewer.getId()) ? "PENDING_SENT" : "PENDING_RECEIVED";
          }
          return "NONE";
        })
        .orElse("NONE");
  }

  private String messageStatus(CommunityDirectMessage message, User viewer) {
    if (!message.getSender().getId().equals(viewer.getId())) {
      return "RECU";
    }
    return message.getReadAt() != null ? "VU" : "ENVOYE";
  }

  private CommunityPostReaction.ReactionType parseReaction(String rawType) {
    if (rawType == null || rawType.isBlank()) {
      return CommunityPostReaction.ReactionType.LIKE;
    }
    return CommunityPostReaction.ReactionType.valueOf(rawType.trim().toUpperCase());
  }

  private boolean isCommunityVisibleUser(User user) {
    return user.getRoles().contains("ROLE_PATIENT") || user.getRoles().contains("ROLE_USER") || user.getRoles().contains("ROLE_DOCTOR");
  }

  private String roleLabel(User user) {
    if (user.getRoles().contains("ROLE_DOCTOR")) {
      return "Medecin";
    }
    if (user.getRoles().contains("ROLE_ADMIN")) {
      return "Admin";
    }
    return "Patient";
  }

  private String safeName(User user) {
    if (user.getFullName() != null && !user.getFullName().isBlank()) {
      return user.getFullName();
    }
    if (user.getEmail() != null && user.getEmail().contains("@")) {
      return user.getEmail().substring(0, user.getEmail().indexOf('@'));
    }
    return "Membre NeuralConsult";
  }

  private String requireText(String value, String message) {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException(message);
    }
    return trimToLength(value, 5000);
  }

  private String trimToLength(String value, int maxLength) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
  }
}
