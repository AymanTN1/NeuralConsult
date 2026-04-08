package com.neuralconsult.sevrage.community;

import com.neuralconsult.sevrage.community.dto.CommunityChannelResponse;
import com.neuralconsult.sevrage.community.dto.CommunityDetailResponse;
import com.neuralconsult.sevrage.community.dto.CommunityMessageCreateRequest;
import com.neuralconsult.sevrage.community.dto.CommunityMessageResponse;
import com.neuralconsult.sevrage.community.dto.CommunityServerCreateRequest;
import com.neuralconsult.sevrage.community.dto.CommunityServerResponse;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CommunityService {

  private final CommunityServerRepository serverRepository;
  private final CommunityChannelRepository channelRepository;
  private final CommunityMemberRepository memberRepository;
  private final CommunityMessageRepository messageRepository;

  public CommunityService(CommunityServerRepository serverRepository,
                          CommunityChannelRepository channelRepository,
                          CommunityMemberRepository memberRepository,
                          CommunityMessageRepository messageRepository) {
    this.serverRepository = serverRepository;
    this.channelRepository = channelRepository;
    this.memberRepository = memberRepository;
    this.messageRepository = messageRepository;
  }

  @Transactional
  public CommunityServerResponse createServer(User user, CommunityServerCreateRequest request) {
    CommunityServer server = new CommunityServer();
    server.setName(request.name());
    server.setDescription(request.description());
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
  public CommunityServerResponse join(User user, java.util.UUID serverId) {
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
  public CommunityDetailResponse detail(User user, java.util.UUID serverId) {
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
  public List<CommunityMessageResponse> listMessages(User user, java.util.UUID channelId) {
    CommunityChannel channel = channelRepository.findById(channelId).orElseThrow();
    ensureMembership(channel.getServer(), user);
    return messageRepository.findAllByChannelOrderByCreatedAtAsc(channel).stream().map(this::toMessageResponse).toList();
  }

  @Transactional
  public CommunityMessageResponse postMessage(User user, java.util.UUID channelId, CommunityMessageCreateRequest request) {
    CommunityChannel channel = channelRepository.findById(channelId).orElseThrow();
    ensureMembership(channel.getServer(), user);
    CommunityMessage message = new CommunityMessage();
    message.setChannel(channel);
    message.setAuthor(user);
    message.setContent(request.content());
    return toMessageResponse(messageRepository.save(message));
  }

  private void ensureMembership(CommunityServer server, User user) {
    memberRepository.findByServerAndUser(server, user).orElseThrow(() ->
        new IllegalArgumentException("Vous devez rejoindre cette communaute avant d'y acceder."));
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
        message.getAuthor().getFullName(),
        message.getContent(),
        message.getCreatedAt()
    );
  }
}
