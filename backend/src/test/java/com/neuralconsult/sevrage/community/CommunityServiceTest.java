package com.neuralconsult.sevrage.community;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.neuralconsult.sevrage.community.dto.*;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("🛡️ Unit Tests - CommunityService (JUnit 5 + Mockito)")
class CommunityServiceTest {

  @Mock private CommunityServerRepository serverRepository;
  @Mock private CommunityChannelRepository channelRepository;
  @Mock private CommunityMemberRepository memberRepository;
  @Mock private CommunityMessageRepository messageRepository;
  @Mock private CommunityPostRepository postRepository;
  @Mock private CommunityPostCommentRepository commentRepository;
  @Mock private CommunityPostReactionRepository reactionRepository;
  @Mock private CommunityFollowRepository followRepository;
  @Mock private CommunityConnectionRepository connectionRepository;
  @Mock private CommunityDirectMessageRepository directMessageRepository;
  @Mock private UserRepository userRepository;

  @InjectMocks private CommunityService communityService;

  private User mockUser;

  private void setId(Object entity, UUID id) {
    ReflectionTestUtils.setField(entity, "id", id);
  }

  @BeforeEach
  void setUp() {
    mockUser = new User();
    setId(mockUser, UUID.randomUUID());
    mockUser.setFirstName("Ayman");
    mockUser.setLastName("Tantani");
    mockUser.setFullName("Dr. Ayman Tantani");
    mockUser.setCommunityUsername("ayman_tantani");
    mockUser.getRoles().add("ROLE_DOCTOR");
    mockUser.setCommunityBio("Développeur Senior & Architecte DevOps.");
  }

  @Test
  @DisplayName("Should successfully return the profile response of a managed user")
  void shouldReturnProfileResponse() {
    // Given
    when(userRepository.findById(mockUser.getId())).thenReturn(Optional.of(mockUser));

    // When
    CommunityProfileResponse response = communityService.myProfile(mockUser);

    // Then
    assertThat(response).isNotNull();
    assertThat(response.id()).isEqualTo(mockUser.getId());
    assertThat(response.name()).isEqualTo("@ayman_tantani");
    assertThat(response.communityUsername()).isEqualTo("ayman_tantani");
    assertThat(response.roleLabel()).isEqualTo("Medecin");
    assertThat(response.bio()).isEqualTo(mockUser.getCommunityBio());
    assertThat(response.profileCompleted()).isTrue();

    verify(userRepository, times(1)).findById(mockUser.getId());
  }

  @Test
  @DisplayName("Should successfully create a new community server and its default general channel")
  void shouldCreateCommunityServer() {
    // Given
    CommunityServerCreateRequest request = new CommunityServerCreateRequest(
        "Groupe de Sevrage Tabac",
        "Soutien pour l'arrêt de la cigarette.",
        "PUBLIC",
        ""
    );

    UUID generatedServerId = UUID.randomUUID();
    CommunityServer mockServer = new CommunityServer();
    setId(mockServer, generatedServerId);
    mockServer.setName(request.name());
    mockServer.setDescription(request.description());
    mockServer.setCreatedByUser(mockUser);

    when(userRepository.findById(mockUser.getId())).thenReturn(Optional.of(mockUser));
    when(serverRepository.save(any(CommunityServer.class))).thenReturn(mockServer);

    // When
    CommunityServerResponse response = communityService.createServer(mockUser, request);

    // Then
    assertThat(response).isNotNull();
    assertThat(response.id()).isEqualTo(generatedServerId);
    assertThat(response.name()).isEqualTo(request.name());
    assertThat(response.description()).isEqualTo(request.description());
    assertThat(response.creatorName()).isEqualTo("Dr. Ayman Tantani");
    assertThat(response.joined()).isTrue();

    verify(serverRepository, times(1)).save(any(CommunityServer.class));
    verify(memberRepository, times(1)).save(any(CommunityMember.class));
    verify(channelRepository, times(1)).save(any(CommunityChannel.class));
  }
}
